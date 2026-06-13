"use client";

import { motion } from "framer-motion";
import { ArrowRight, OctagonAlert } from "lucide-react";
import { type Dossier } from "@/lib/features/dossiers";
import { RESPONSABLE_ROLES } from "@/lib/features/pipeline";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { VilleCell } from "@/components/ui/centre-cell";
import { Button } from "@/components/ui/button";
import { type RowSelection } from "@/components/hooks/useRowSelection";

interface DossiersTableProps {
  displayedDossiers: Dossier[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  getRowId: (row: Dossier) => string;
  /** Resolve a dossier's etape_pipeline → its dynamic pipeline label (settings catalog). */
  phaseLabel?: (etape?: string | null) => string;
  /** Clicking a row / the detail button opens the CENTRE profile. */
  onOpenCentre?: (centreId: string) => void;
  /** Hovering a row — warms the centre detail cache for a snappy open. */
  onHoverCentre?: (centreId: string) => void;
  selection?: RowSelection;
}

const TYPE_DOSSIER_LABEL: Record<string, string> = { centre: "Centre", controleur: "Contrôleur" };
const ROLE_LABEL: Record<string, string> = Object.fromEntries(RESPONSABLE_ROLES.map((r) => [r.value, r.label]));

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function DossiersTable({
  displayedDossiers,
  totalItems,
  currentPage,
  totalPages,
  goToPage,
  getRowId,
  phaseLabel,
  onOpenCentre,
  onHoverCentre,
  selection,
}: DossiersTableProps) {
  const open = (item: Dossier) => onOpenCentre?.(item.id);

  const columns: DataTableColumn<Dossier>[] = [
    {
      id: "centre",
      header: "Centre",
      width: "minmax(200px,1.4fr)",
      cell: (item) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-[#332151] transition-colors group-hover:text-[#E34F2D]">
            {item.centre}
          </p>
          <span className="mt-0.5 block font-mono text-[10px] font-normal text-[#5A5A7A]">{item.code ?? item.id}</span>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      width: "120px",
      cell: (item) =>
        item.typeDossier ? (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
              item.typeDossier === "centre" ? "bg-[#332151]/10 text-[#332151]" : "bg-slate-100 text-[#5A5A7A]"
            }`}
          >
            {TYPE_DOSSIER_LABEL[item.typeDossier] ?? cap(item.typeDossier)}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">—</span>
        ),
    },
    {
      id: "ville",
      header: "Ville",
      width: "minmax(120px,1fr)",
      cell: (item) => <VilleCell ville={item.ville} />,
    },
    {
      id: "phase",
      header: "Phase",
      width: "170px",
      cell: (item) => {
        const blocked = item.macro === "bloque" || item.joursInactif >= 14;
        return (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-[#332151]">
              {phaseLabel ? phaseLabel(item.etape) : (item.phase === "Dépôt" ? "Dépôt agrément" : item.phase)}
            </span>
            {blocked && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#E11D48]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#E11D48]" title="Dossier bloqué">
                <OctagonAlert className="h-3 w-3" /> Bloqué
              </span>
            )}
          </span>
        );
      },
    },
    {
      id: "inactivite",
      header: "Inactivité",
      width: "100px",
      align: "center",
      cell: (item) => (
        <span className={`text-xs font-medium tabular-nums ${item.joursInactif >= 5 ? "text-[#E11D48]" : "text-[#5A5A7A]"}`}>
          {item.joursInactif} j
        </span>
      ),
    },
    {
      id: "contrat",
      header: "Contrat",
      width: "90px",
      align: "center",
      cell: (item) =>
        item.typeContrat ? (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
              item.typeContrat === "R" ? "bg-[#332151]/10 text-[#332151]" : "bg-[#E34F2D]/10 text-[#E34F2D]"
            }`}
          >
            {item.typeContrat}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">—</span>
        ),
    },
    {
      id: "activites",
      header: "Activités",
      width: "130px",
      cell: (item) =>
        item.activites && item.activites.length > 0 ? (
          <span className="text-[11px] font-normal text-[#5A5A7A]">{item.activites.join(" · ")}</span>
        ) : (
          <span className="text-[11px] text-slate-400">—</span>
        ),
    },
    {
      id: "responsable",
      header: "Responsable",
      width: "150px",
      cell: (item) => (
        <span className="text-[11px] font-normal text-[#5A5A7A]">
          {item.responsableRole ? ROLE_LABEL[item.responsableRole] ?? item.responsableRole : "—"}
        </span>
      ),
    },
    {
      id: "nbDossiers",
      header: "Dossiers",
      width: "90px",
      align: "center",
      cell: (item) => <span className="text-xs font-medium tabular-nums text-[#332151]">{item.nbDossiers ?? "—"}</span>,
    },
    {
      id: "detail",
      header: "Détail",
      width: "180px",
      align: "center",
      cell: (item) => (
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); open(item); }}
          className="gap-1.5 text-[11px] font-semibold bg-[#E34F2D]/10 text-[#E34F2D] shadow-none hover:bg-[#E34F2D]/20 hover:text-[#E34F2D]"
        >
          Voir les détails
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      ),
    },
  ];

  return (
    <motion.div
      key="tableau"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/50 overflow-hidden p-4 sm:p-6"
    >
      <DataTable<Dossier>
        data={displayedDossiers}
        columns={columns}
        getRowId={getRowId}
        minWidth="1320px"
        selection={selection}
        onRowClick={open}
        onRowHover={onHoverCentre ? (item) => onHoverCentre(item.id) : undefined}
        hideToolbar
        bare
        emptyMessage="Aucun dossier ne correspond à vos filtres."
        pagination={{ page: currentPage, totalPages, totalItems, numbered: true, onPageChange: goToPage }}
      />
    </motion.div>
  );
}
