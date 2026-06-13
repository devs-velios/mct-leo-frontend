"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { List, Kanban as KanbanIcon, Menu, X } from "lucide-react";
import DossiersTable from "@/components/dossiers/DossiersTable";
import DossiersKanban from "@/components/dossiers/DossiersKanban";
import {
  useDossiersContext,
  type Dossier,
  type DossierSubFilter,
  dossierToRow,
  filterDossiers,
  stageLabel,
  MICRO_STAGES,
} from "@/lib/features/dossiers";
import { useCentresContext } from "@/lib/features/centres";
import { usePipelineContext } from "@/lib/features/pipeline";
import { useDeleteCentre } from "@/lib/features/useDeleteCentre";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Select from "@/components/ui/Select";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { CityFilter } from "@/components/ui/city-filter";
import { useRowSelection } from "@/components/hooks/useRowSelection";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";

const DAY = 86_400_000;

interface DossiersViewProps {
  /** Clicking a row opens the CENTRE profile (not a dossier view). */
  onOpenCentre?: (centreId: string) => void;
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function DossiersView({ onOpenCentre, setMobileMenuOpen }: DossiersViewProps) {
  const { dossiers, isLoading, ensureLoaded } = useDossiersContext();
  const { centres, ensureList, getDetail } = useCentresContext();
  const { phases, ensureLoaded: ensurePipeline } = usePipelineContext();
  // A dossier can't be deleted on its own — it belongs to a centre. Deleting the centre
  // (via the centres route) removes the centre AND its dossiers, and refreshes both caches.
  const deleteCentre = useDeleteCentre();
  const [dossiersList, setDossiersList] = useState<Dossier[]>([]);
  // Deep-link filters from the dashboard (KPI "Dossiers bloqués" → ?statut=bloque,
  // funnel segment → ?etape=<phase>). Read once at mount; both stay clearable.
  const searchParams = useSearchParams();
  const [selectedSubFilter, setSelectedSubFilter] = useState<DossierSubFilter>(
    searchParams.get("statut") === "bloque" ? "bloques" : "tout",
  );
  const [etapeFilter, setEtapeFilter] = useState<string | null>(searchParams.get("etape"));

  // Cache-guarded loads.
  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);
  useEffect(() => { ensurePipeline(); }, [ensurePipeline]);

  // Map backend rows → view shape, ENRICHED from the centres list (contract type,
  // activities, inactivity) and the pipeline catalog (responsible role), plus a
  // per-centre dossier count. All joins are frontend-only.
  useEffect(() => {
    const now = Date.now();
    const centreById = new Map(centres.map((c) => [c.id, c]));
    const roleByEtape = new Map(phases.map((p) => [p.name, p.responsable_role]));
    const countByCentre = new Map<string, number>();
    for (const d of dossiers) {
      const cid = d.centre?.id;
      if (cid) countByCentre.set(cid, (countByCentre.get(cid) ?? 0) + 1);
    }
    setDossiersList(
      dossiers.map((d) => {
        const base = dossierToRow(d);
        const centre = d.centre?.id ? centreById.get(d.centre.id) : undefined;
        // Days since last activity: centre's last message → centre creation → finally the
        // dossier's own created_at, so a missing centre join never collapses this to a fake 0.
        const last = centre?.last_activity_at ?? centre?.created_at ?? d.created_at ?? null;
        const joursInactif = last ? Math.max(0, Math.floor((now - new Date(last).getTime()) / DAY)) : 0;
        return {
          ...base,
          joursInactif,
          typeDossier: d.type_dossier,
          typeContrat: centre?.type_contrat,
          activites: centre?.activites,
          responsableRole: roleByEtape.get(d.etape_pipeline) ?? null,
          nbDossiers: d.centre?.id ? countByCentre.get(d.centre.id) : undefined,
        };
      }),
    );
  }, [dossiers, centres, phases]);

  const [searchQuery, setSearchQuery] = useState("");
  const [villeSel, setVilleSel] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"tableau" | "kanban">("tableau");

  // Stages come from the dynamic pipeline catalog (settings page), in `order`. Fall back to
  // the canonical MICRO_STAGES only until the catalog resolves, so columns/filters never flash empty.
  const stages = useMemo(
    () => (phases.length ? phases.map((p) => ({ key: p.name, label: p.label })) : MICRO_STAGES),
    [phases],
  );
  // Dynamic phase filter dropdown — one option per pipeline stage, plus an "all" reset.
  const phaseOptions = useMemo(
    () => [{ value: "all", label: "Toutes les phases" }, ...stages.map((s) => ({ value: s.key, label: s.label }))],
    [stages],
  );
  // Resolve an etape_pipeline slug → its pipeline label (humanized fallback for unknown values).
  const phaseLabel = useMemo(() => {
    const byKey = new Map(stages.map((s) => [s.key, s.label]));
    return (key?: string | null) => (key && byKey.get(key)) || stageLabel(key);
  }, [stages]);

  // Drag and Drop local states
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<string | null>(null);

  // Table pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubFilter, searchQuery, villeSel, etapeFilter]);

  const filteredDossiers = filterDossiers(dossiersList, {
    search: searchQuery,
    subFilter: selectedSubFilter,
    villes: villeSel,
    etape: etapeFilter ?? undefined,
  });

  // Pagination calculation
  const totalItems = filteredDossiers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedDossiers = filteredDossiers.slice(startIndex, endIndex);

  // Row id = dossier UUID (unique per row, even when a centre holds several dossiers).
  const rowKey = (d: Dossier) => d.dossierId ?? d.id;
  const selection = useRowSelection(filteredDossiers.map(rowKey));

  // Bulk delete resolves each selected dossier back to its centre id (delete is centre-based).
  const handleBulkDelete = async () => {
    const ids = new Set(selection.selectedIds);
    const centreIds = [...new Set(dossiersList.filter((d) => ids.has(rowKey(d))).map((d) => d.id))];
    setDossiersList((prev) => prev.filter((d) => !ids.has(rowKey(d)))); // optimistic
    await Promise.all(centreIds.map((id) => deleteCentre(id).catch(() => {}))); // refreshes both caches
  };

  // Drag and drop HTML5 handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDragEnter = (e: React.DragEvent, colName: string) => { e.preventDefault(); setActiveDropCol(colName); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (id) {
      // Optimistic, local-only move to the target pipeline stage (etape_pipeline).
      // TODO(backend): persist the stage change (advance-stage / PATCH dossier etape_pipeline).
      setDossiersList((prevList) =>
        prevList.map((dossier) => ((dossier.dossierId ?? dossier.id) === id ? { ...dossier, etape: targetCol } : dossier)),
      );
    }
    setDraggedId(null);
    setActiveDropCol(null);
  };

  const hasChips = selectedSubFilter === "bloques";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F5F7]">
      <header className="px-4 sm:px-6 py-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 bg-white border-b border-slate-100 relative z-10 shrink-0 w-full min-w-0">
        <div className="w-full xl:w-auto">
          {setMobileMenuOpen && (
            <div className="flex items-center justify-between md:hidden mb-2 w-full">
              <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          )}
          <h2 className="text-lg sm:text-2xl font-bold font-serif-mct text-[#332151] tracking-tight">
            Tous les dossiers
          </h2>
          <p className="text-xs text-[#5A5A7A] mt-0.5">
            Vue d'ensemble du pipeline d'onboarding et de l'agrément.
          </p>
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 w-full min-w-0 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-4">

          {/* Search (left) → Tableau/Kanban toggle → filters (phase + city), all in one bar. */}
          <TableToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Rechercher par code, ville, gérant..."
            className="relative z-10"
          >
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "tableau" | "kanban")} className="shrink-0">
              <TabsList>
                <TabsTrigger value="tableau"><List className="h-3.5 w-3.5" /> Tableau</TabsTrigger>
                <TabsTrigger value="kanban"><KanbanIcon className="h-3.5 w-3.5" /> Kanban</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select
              value={etapeFilter ?? "all"}
              options={phaseOptions}
              onChange={(v) => setEtapeFilter(v === "all" ? null : v)}
              className="min-w-[170px]"
            />
            <CityFilter cities={dossiersList.map((d) => d.ville)} selected={villeSel} onChange={setVilleSel} />
          </TableToolbar>

          {/* Active deep-link filters (clearable) */}
          {hasChips && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedSubFilter === "bloques" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E11D48]/10 px-3 py-1 text-[11px] font-bold text-[#E11D48]">
                  Bloqués
                  <button onClick={() => setSelectedSubFilter("tout")} className="rounded-full p-0.5 hover:bg-[#E11D48]/20" aria-label="Retirer le filtre">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {isLoading && dossiersList.length === 0 ? (
            <SkeletonTable rows={8} cols={6} />
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === "tableau" ? (
                <DossiersTable
                  displayedDossiers={displayedDossiers}
                  totalItems={totalItems}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  goToPage={setCurrentPage}
                  getRowId={rowKey}
                  phaseLabel={phaseLabel}
                  onOpenCentre={onOpenCentre}
                  onHoverCentre={(id) => { void getDetail(id).catch(() => {}); }}
                  selection={selection}
                />
              ) : (
                <DossiersKanban
                  filteredDossiers={filteredDossiers}
                  columns={stages}
                  draggedId={draggedId}
                  activeDropCol={activeDropCol}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onOpenDossier={onOpenCentre}
                />
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      <BulkActionBar
        count={selection.count}
        onClear={selection.clear}
        onDelete={handleBulkDelete}
        noun={["dossier", "dossiers"]}
      />
    </div>
  );
}
