"use client";

import { motion } from "framer-motion";
import { ChevronRight, MapPin, Calendar } from "lucide-react";
import { type Dossier } from "./dossiersData";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
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
  startIndex,
  endIndex,
  currentPage,
  totalPages,
  setCurrentPage,
  goToPage,
  onOpenDossier,
  selection,
}: DossiersTableProps) {
  const colCount = selection ? 6 : 5;
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

      {/* Table */}
      <Table className="min-w-[760px]">
        <TableHeader className="bg-slate-50/70">
          <TableRow className="hover:bg-transparent">
            {selection && (
              <TableHead className="w-12 px-6">
                <Checkbox
                  checked={selection.allSelected}
                  indeterminate={selection.someSelected}
                  onCheckedChange={selection.toggleAll}
                  label="Tout sélectionner"
                />
              </TableHead>
            )}
            <TableHead className="px-6">Centre</TableHead>
            <TableHead className="px-5">Ville</TableHead>
            <TableHead className="px-5">Phase</TableHead>
            <TableHead className="px-5">Créé le</TableHead>
            <TableHead className="px-6 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedDossiers.map((item) => (
            <TableRow
              key={item.id}
              className={`group cursor-pointer ${selection?.isSelected(item.id) ? "bg-[#E34F2D]/[0.04]" : ""}`}
              onClick={() => onOpenDossier?.(item.dossierId ?? item.id)}
            >
              {selection && (
                <TableCell className="px-6" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selection.isSelected(item.id)}
                    onCheckedChange={() => selection.toggle(item.id)}
                    label={`Sélectionner ${item.centre}`}
                  />
                </TableCell>
              )}
              {/* 1. Centre identity */}
              <TableCell className="px-6">
                <p className="text-sm font-semibold leading-tight text-[#332151] transition-colors group-hover:text-[#E34F2D]">
                  {item.centre}
                </p>
                <span className="mt-1 block font-mono text-[10px] font-normal text-[#5A5A7A]">
                  {item.code ?? item.id}
                </span>
              </TableCell>

              {/* 2. Ville */}
              <TableCell className="px-5">
                <span className="inline-flex items-center gap-1.5 text-xs font-normal text-[#5A5A7A]">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {item.ville || "Non disponible"}
                </span>
              </TableCell>

              {/* 3. Phase status — neutral pill */}
              <TableCell className="px-5">
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-[#332151]">
                  {item.phase === "Dépôt" ? "Dépôt agrément" : item.phase}
                </span>
              </TableCell>

              {/* 4. Created date (real, from created_at) */}
              <TableCell className="px-5">
                <span className="flex items-center gap-1.5 text-xs font-normal text-[#5A5A7A]">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {item.signatureDate || "Non disponible"}
                </span>
              </TableCell>

              {/* 5. Action — open the centre profile */}
              <TableCell className="px-6 text-right">
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenDossier?.(item.dossierId ?? item.id); }}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-[#E34F2D]/10 hover:text-[#E34F2D] group-hover:text-[#E34F2D]"
                  title="Ouvrir le dossier"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {displayedDossiers.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colCount} className="py-12 text-center text-sm text-[#5A5A7A] font-semibold">
                Aucun dossier ne correspond à vos filtres.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-slate-100">
        <span className="text-[10px] font-extrabold text-[#5A5A7A] uppercase tracking-wider">
          Affichage de {totalItems > 0 ? startIndex + 1 : 0} à {Math.min(endIndex, totalItems)} sur {totalItems} dossiers
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-150 flex items-center gap-1 cursor-pointer ${
              currentPage === 1
                ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                : "bg-white border border-slate-200 text-[#332151] hover:bg-slate-50 active:scale-95 shadow-sm"
            }`}
          >
            Précédent
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`h-7 w-7 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                currentPage === page
                  ? "bg-[#E34F2D] text-white shadow-sm"
                  : "bg-white border border-slate-200 text-[#332151] hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-150 flex items-center gap-1 cursor-pointer ${
              currentPage === totalPages
                ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                : "bg-white border border-slate-200 text-[#332151] hover:bg-slate-50 active:scale-95 shadow-sm"
            }`}
          >
            Suivant
          </button>
        </div>
      </div>
    </motion.div>
  );
}
