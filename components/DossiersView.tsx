"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Search,
  List,
  Kanban as KanbanIcon,
  Menu,
  X
} from "lucide-react";
import DossiersTable from "./dossiers/DossiersTable";
import DossiersKanban from "./dossiers/DossiersKanban";
import {
  useDossiersContext,
  type Dossier,
  type DossierSubFilter,
  dossierToRow,
  filterDossiers,
  dossierStats,
} from "@/lib/features/dossiers";
import { useDeleteCentre } from "@/lib/features/useDeleteCentre";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveTabs } from "@/components/ui/responsive-tabs";
import Select from "@/components/ui/Select";
import { useRowSelection } from "@/components/hooks/useRowSelection";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";

const PHASE_OPTIONS = [
  { value: "all", label: "Toutes les phases" },
  { value: "Signature", label: "Signature" },
  { value: "Onboarding", label: "Onboarding" },
  { value: "Dépôt", label: "Dépôt agrément" },
  { value: "Ouvert", label: "Ouvert" },
  { value: "Suivi qualité", label: "Suivi qualité" },
];

interface DossiersViewProps {
  onOpenDossier?: (id: string) => void;
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function DossiersView({ onOpenDossier, setMobileMenuOpen }: DossiersViewProps) {
  const { dossiers, isLoading, ensureLoaded, advance } = useDossiersContext();
  // A dossier can't be deleted on its own — it belongs to a centre. Deleting the centre
  // (via the centres route) removes the centre AND its dossier, and refreshes both caches.
  const deleteCentre = useDeleteCentre();
  const [dossiersList, setDossiersList] = useState<Dossier[]>([]);
  const [selectedSubFilter, setSelectedSubFilter] = useState<DossierSubFilter>("tout");

  // Cache-guarded load via the shared dossiers context; map backend rows → view shape.
  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
  useEffect(() => { setDossiersList(dossiers.map(dossierToRow)); }, [dossiers]);

  // Move a dossier one stage (macro auto-updates); context refreshes the cached list.
  const handleAdvance = async (dossierId: string, direction: "next" | "back") => {
    try {
      await advance(dossierId, { direction });
    } catch {
      /* 422 at pipeline ends / illegal jump */
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"tableau" | "kanban">("tableau");

  // Drag and Drop local states
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<string | null>(null);

  // Table pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubFilter, searchQuery, selectedPhase]);

  // Filtering + stats rules live in the dossiers feature (single source of truth).
  const filteredDossiers = filterDossiers(dossiersList, {
    phase: selectedPhase,
    search: searchQuery,
    subFilter: selectedSubFilter,
  });
  const { total: statTotal, relancer: statRelancer, bloques: statBloques, ouverts: statOuverts } =
    dossierStats(dossiersList);

  // Pagination calculation
  const totalItems = filteredDossiers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedDossiers = filteredDossiers.slice(startIndex, endIndex);

  // Row selection scoped to the visible (filtered) set, so "select all" + bulk
  // actions act on what the user can see.
  const selection = useRowSelection(filteredDossiers.map((d) => d.id));

  // Bulk delete. NOTE: the backend has no dossiers DELETE route yet — this is a
  // UI-only sample that removes the rows from the local list. Wire it to the real
  // endpoint once available (see BACKEND_NOTES.md → "Bulk delete").
  const handleBulkDelete = async () => {
    // Row ids ARE the centre ids (dossierToRow maps id → centre id). Delete each centre
    // via the centres route → its connected dossier is removed too.
    const ids = [...new Set(selection.selectedIds)];
    setDossiersList((prev) => prev.filter((d) => !ids.includes(d.id))); // optimistic
    await Promise.all(ids.map((id) => deleteCentre(id).catch(() => {}))); // refreshes both caches
  };

  // Drag and drop HTML5 handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, colName: string) => {
    e.preventDefault();
    setActiveDropCol(colName);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetCol: Dossier["phase"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (id) {
      setDossiersList((prevList) =>
        prevList.map((dossier) =>
          dossier.id === id ? { ...dossier, phase: targetCol } : dossier
        )
      );
    }
    setDraggedId(null);
    setActiveDropCol(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F5F7]">
      {/* 1. TOP BAR ACCORDING TO THE SPECIFICATION */}
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

      {/* Main workspace container */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 w-full min-w-0 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* FILTERS ROW */}
          <div className="relative z-20 bg-white p-5 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgba(45,42,86,0.015)] flex flex-col xl:flex-row xl:items-center justify-between gap-5">

            {/* Left filter status tabs (dropdown on mobile) */}
            <ResponsiveTabs
              value={selectedSubFilter}
              onValueChange={(v) => setSelectedSubFilter(v as DossierSubFilter)}
              className="w-full xl:w-auto"
              options={[
                { value: "tout", label: "Tous", count: statTotal },
                { value: "relancer", label: "À relancer", count: statRelancer },
                { value: "bloques", label: "Bloqués", count: statBloques },
                { value: "ouverts", label: "Ouverts", count: statOuverts },
              ]}
            />

            {/* Right Tools Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
              {/* Search text input */}
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Code, ville, gérant..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200/60 pl-9 pr-8 py-2.5 text-[10.5px] font-bold text-slate-700 placeholder-slate-400 outline-none focus:border-[#332151] focus:bg-white focus:ring-2 focus:ring-[#332151]/5 transition-all uppercase tracking-wider shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Phase filter (prebuilt Select) */}
              <Select
                value={selectedPhase}
                options={PHASE_OPTIONS}
                onChange={setSelectedPhase}
                className="min-w-[170px]"
              />

              {/* Table / Kanban view toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "tableau" | "kanban")} className="shrink-0">
                <TabsList>
                  <TabsTrigger value="tableau"><List className="h-3.5 w-3.5" /> Tableau</TabsTrigger>
                  <TabsTrigger value="kanban"><KanbanIcon className="h-3.5 w-3.5" /> Kanban</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* 4. CONDITIONAL PRESENTATION */}
          {isLoading && dossiersList.length === 0 ? (
            <SkeletonTable rows={8} cols={5} />
          ) : (
          <AnimatePresence mode="wait">
            {viewMode === "tableau" ? (
              <DossiersTable
                displayedDossiers={displayedDossiers}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                goToPage={setCurrentPage}
                onOpenDossier={onOpenDossier}
                onAdvance={handleAdvance}
                selection={selection}
              />
            ) : (
              <DossiersKanban
                filteredDossiers={filteredDossiers}
                draggedId={draggedId}
                activeDropCol={activeDropCol}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onOpenDossier={onOpenDossier}
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

