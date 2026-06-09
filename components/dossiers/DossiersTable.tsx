"use client";

import { motion } from "framer-motion";
import { ChevronRight, MapPin, Calendar } from "lucide-react";
import { type Dossier } from "./dossiersData";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { type RowSelection } from "@/components/hooks/useRowSelection";

interface DossiersTableProps {
  displayedDossiers: Dossier[];
  totalItems: number;
  startIndex: number;
  endIndex: number;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (updater: (prev: number) => number) => void;
  goToPage: (page: number) => void;
  onOpenDossier?: (id: string) => void;
  onAdvance?: (dossierId: string, direction: "next" | "back") => void;
  /** When provided, renders a selection column with select-all + per-row checkboxes. */
  selection?: RowSelection;
}

export default function DossiersTable({
  displayedDossiers,
  totalItems,
  currentPage,
  totalPages,
  goToPage,
  onOpenDossier,
  selection,
}: DossiersTableProps) {
  const open = (item: Dossier) => onOpenDossier?.(item.dossierId ?? item.id);

  const columns: DataTableColumn<Dossier>[] = [
    {
      id: "centre",
      header: "Centre",
      width: "minmax(220px,1.4fr)",
      cell: (item) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-[#332151] transition-colors group-hover:text-[#E34F2D]">
            {item.centre}
          </p>
          <span className="mt-1 block font-mono text-[10px] font-normal text-[#5A5A7A]">
            {item.code ?? item.id}
          </span>
        </div>
      ),
    },
    {
      id: "ville",
      header: "Ville",
      width: "minmax(120px,1fr)",
      cell: (item) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-normal text-[#5A5A7A]">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          {item.ville || "Non disponible"}
        </span>
      ),
    },
    {
      id: "phase",
      header: "Phase",
      width: "160px",
      cell: (item) => (
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-[#332151]">
          {item.phase === "Dépôt" ? "Dépôt agrément" : item.phase}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Créé le",
      width: "150px",
      cell: (item) => (
        <span className="flex items-center gap-1.5 text-xs font-normal text-[#5A5A7A]">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          {item.signatureDate || "Non disponible"}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      width: "80px",
      align: "right",
      cell: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            open(item);
          }}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[#E34F2D]/10 hover:text-[#E34F2D] group-hover:text-[#E34F2D]"
          title="Ouvrir le dossier"
        >
          <ChevronRight className="h-[18px] w-[18px]" />
        </button>
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
      className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/50 flex flex-col justify-between overflow-hidden"
    >
      {/* Cards Header Section */}
      <div className="p-6 border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-extrabold font-serif-mct text-[#332151]">{totalItems} dossiers</h4>
          <p className="text-[10px] text-[#5A5A7A] mt-0.5">
            Suivi des centres et validation de l'onboarding technique.
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <DataTable<Dossier>
          data={displayedDossiers}
          columns={columns}
          getRowId={(item) => item.id}
          minWidth="760px"
          selection={selection}
          onRowClick={open}
          hideToolbar
          bare
          emptyMessage="Aucun dossier ne correspond à vos filtres."
          pagination={{
            page: currentPage,
            totalPages,
            totalItems,
            numbered: true,
            onPageChange: goToPage,
          }}
        />
      </div>
    </motion.div>
  );
}
