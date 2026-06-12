"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Menu, Plus, ArrowRight } from "lucide-react";
import {
  useCentresContext,
  type CentreListItem,
  type CreateCentrePayload,
  filterCentres,
} from "@/lib/features/centres";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { CityFilter } from "@/components/ui/city-filter";
import { CentreCell, VilleCell } from "@/components/ui/centre-cell";
import { useRowSelection } from "@/components/hooks/useRowSelection";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { useDeleteCentre } from "@/lib/features/useDeleteCentre";
import CreateCentreModal, { type CentreFormValues } from "./centres/CreateCentreModal";

// statut_ouverture → display + tone.
const STATUT: Record<string, { label: string; cls: string }> = {
  onboarding: { label: "Onboarding", cls: "bg-slate-100 text-slate-600" },
  audit: { label: "Audit initial", cls: "bg-amber-50 text-amber-700" },
  agrement_en_cours: { label: "Agrément en cours", cls: "bg-amber-50 text-amber-700" },
  ouvert: { label: "Ouvert", cls: "bg-emerald-50 text-emerald-700" },
  bloque: { label: "Bloqué", cls: "bg-rose-50 text-rose-700" },
};

// Multi-select filter options (statut + activités). No enseigne filter — MCT is a single network.
const STATUT_OPTIONS: MultiSelectOption[] = Object.entries(STATUT).map(([value, { label }]) => ({ value, label }));
const ACTIVITE_OPTIONS: MultiSelectOption[] = [
  { value: "VL", label: "VL" },
  { value: "PL", label: "PL" },
  { value: "CL", label: "CL" },
];

interface CentresViewProps {
  setMobileMenuOpen?: (open: boolean) => void;
  onOpenDossier?: (id: string) => void;
}

function contactsOf(v: CentreFormValues): Record<string, string> {
  const c: Record<string, string> = {};
  if (v.responsable.trim()) c.responsable = v.responsable.trim();
  if (v.phone.trim()) c.phone = v.phone.trim();
  if (v.email.trim()) c.email = v.email.trim();
  return c;
}

export default function CentresView({ setMobileMenuOpen, onOpenDossier }: CentresViewProps) {
  const { centres, isListLoading, ensureList, create, getDetail } = useCentresContext();
  const deleteCentre = useDeleteCentre();

  const [search, setSearch] = useState("");
  const [statutSel, setStatutSel] = useState<string[]>([]);
  const [activiteSel, setActiviteSel] = useState<string[]>([]);
  const [villeSel, setVilleSel] = useState<string[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);

  const rows = useMemo(
    () => filterCentres(centres, { search, statut: statutSel, activites: activiteSel, villes: villeSel }),
    [centres, statutSel, activiteSel, villeSel, search],
  );

  // Multi-select + bulk delete (scoped to the filtered rows). Deleting a centre also
  // removes its connected dossier(s) via the centres delete route.
  const selection = useRowSelection(rows.map((c) => c.id));
  const handleBulkDelete = async () => {
    await Promise.all([...new Set(selection.selectedIds)].map((id) => deleteCentre(id).catch(() => {})));
  };

  // ── Create only — all editing/deletion lives on the dossier page ──────────────
  const openCreate = () => {
    setModalOpen(true);
  };

  const handleSubmit = async (v: CentreFormValues) => {
    setSubmitting(true);
    const payload = {
      code_centre: v.code_centre.trim(),
      enseigne: v.enseigne.trim() || undefined,
      ville: v.ville.trim() || undefined,
      type_contrat: v.type_contrat,
      activites: v.activites,
      street: v.street.trim() || undefined,
      street2: v.street2.trim() || undefined,
      zip: v.zip.trim() || undefined,
      region: v.region.trim() || undefined,
      country: v.country.trim() || undefined,
      contacts_clients: contactsOf(v),
    };
    try {
      await create(payload as CreateCentrePayload);
      setModalOpen(false);
      toast.success(`Centre « ${payload.code_centre} » créé.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F5F7]">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 bg-white border-b border-slate-100 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold font-serif-mct text-[#332151] tracking-tight">Centres Agréés</h2>
            <p className="text-xs text-[#5A5A7A] mt-0.5">Sélectionnez un centre pour ouvrir son dossier — suivi, pièces, relances et conformité.</p>
          </div>
          <button onClick={() => setMobileMenuOpen?.(true)} className="shrink-0 rounded-lg p-2 text-[#332151] hover:bg-slate-100 md:hidden" aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button>
        </div>
        <Button onClick={openCreate} className="gap-1.5 text-xs font-bold self-start">
          <Plus className="h-4 w-4" /> Créer un centre
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
        <div className="max-w-[1500px] mx-auto space-y-6">
          {/* Search + filters */}
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Rechercher par code, enseigne, ville..."
          >
            <MultiSelect
              options={STATUT_OPTIONS}
              selected={statutSel}
              onChange={setStatutSel}
              placeholder="Statut"
              searchPlaceholder="Rechercher un statut…"
              emptyText="Aucun statut."
            />
            <MultiSelect
              options={ACTIVITE_OPTIONS}
              selected={activiteSel}
              onChange={setActiviteSel}
              placeholder="Activités"
              searchPlaceholder="Rechercher une activité…"
              emptyText="Aucune activité."
            />
            <CityFilter cities={centres.map((c) => c.ville)} selected={villeSel} onChange={setVilleSel} />
          </TableToolbar>

          {/* Table — basic info + open-dossier launcher */}
          {isListLoading && centres.length === 0 ? (
            <SkeletonTable rows={6} cols={6} />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden p-4 sm:p-5">
              <DataTable<CentreListItem>
                data={rows}
                getRowId={(c) => c.id}
                minWidth="900px"
                hideToolbar
                bare
                selection={selection}
                onRowClick={(c) => onOpenDossier?.(c.id)}
                onRowHover={(c) => { void getDetail(c.id).catch(() => {}); }}
                emptyMessage="Aucun centre ne correspond à votre recherche."
                columns={[
                  {
                    id: "centre",
                    header: "Centre",
                    width: "minmax(220px,1.6fr)",
                    cell: (c) => <CentreCell name={c.enseigne} code={c.code_centre} />,
                  },
                  {
                    id: "ville",
                    header: "Ville",
                    width: "minmax(120px,1fr)",
                    cell: (c) => <VilleCell ville={c.ville} />,
                  },
                  {
                    id: "activites",
                    header: "Activités",
                    width: "180px",
                    cell: (c) => (
                      <span className="text-[11px] font-semibold text-[#5A5A7A]">
                        {(c.activites ?? []).join(" · ") || "Non disponible"}
                      </span>
                    ),
                  },
                  {
                    id: "statut",
                    header: "Statut",
                    width: "150px",
                    cell: (c) => {
                      const st = STATUT[c.statut_ouverture] ?? { label: c.statut_ouverture, cls: "bg-slate-100 text-slate-500" };
                      return (
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                          {st.label}
                        </span>
                      );
                    },
                  },
                  {
                    id: "detail",
                    header: "Détail",
                    width: "180px",
                    align: "center",
                    cell: (c) => (
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onOpenDossier?.(c.id); }}
                        className="gap-1.5 text-[11px] font-bold bg-[#E34F2D]/10 text-[#E34F2D] shadow-none hover:bg-[#E34F2D]/20 hover:text-[#E34F2D]"
                      >
                        Voir les détails
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      <CreateCentreModal
        open={modalOpen}
        mode="create"
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <BulkActionBar
        count={selection.count}
        onClear={selection.clear}
        onDelete={handleBulkDelete}
        noun={["centre", "centres"]}
      />
    </div>
  );
}
