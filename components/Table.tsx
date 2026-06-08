"use client";

import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Table as DataTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Dossier {
  id: string;
  code?: string;
  enseigne: string;
  ville: string;
  gerant: string;
  phase: string;
  joursInactif: number;
  statut: string;
  contact: string;
}

interface TableProps {
  filteredDossiers: Dossier[];
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  dossiersList: Dossier[];
  onOpenDossier?: (id: string) => void;
}

export default function Table({
  filteredDossiers,
  selectedFilter,
  setSelectedFilter,
  dossiersList,
  onOpenDossier
}: TableProps) {
  // Compute counts dynamically based on the actual list
  const countTous = dossiersList.length;
  const countCritiques = dossiersList.filter(d => d.joursInactif >= 5).length;
  const countOnboarding = dossiersList.filter(d => d.phase === "Onboarding").length;
  const countAgrement = dossiersList.filter(d => d.phase === "Dépôt Agrément").length;

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Reset page number on tab filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter]);

  const totalItems = filteredDossiers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedDossiers = filteredDossiers.slice(startIndex, endIndex);

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between overflow-hidden w-full min-w-0">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#EA5B2D]">ALERTES</span>
            <h4 className="text-base font-bold font-serif-mct text-[#2D2A56]">Dossiers nécessitant un suivi</h4>
            <p className="text-[10px] text-[#5A5A7A] mt-0.5">Top des dossiers inactifs en onboarding ou dépôt agrément</p>
          </div>
          
          {/* Category filter tabs */}
          <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
              <TabsTrigger value="tous">Tout ({countTous})</TabsTrigger>
              <TabsTrigger value="critiques">Critique ≥ 5j ({countCritiques})</TabsTrigger>
              <TabsTrigger value="onboarding">Onboarding ({countOnboarding})</TabsTrigger>
              <TabsTrigger value="agrement">Dépôt agrément ({countAgrement})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Responsive Table */}
        <DataTable className="min-w-[520px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Dossier</TableHead>
              <TableHead className="w-[150px]">Phase</TableHead>
              <TableHead className="w-[110px] text-center">Inactivité</TableHead>
              <TableHead className="w-[70px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedDossiers.map((dossier) => (
              <TableRow
                key={dossier.id}
                className="group cursor-pointer"
                onClick={() => onOpenDossier?.(dossier.id)}
              >
                {/* Primary: enseigne (title) + merged code · ville */}
                <TableCell>
                  <p className="text-[13px] font-bold text-slate-800 leading-snug group-hover:text-[#EA5B2D] transition-colors">{dossier.enseigne}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    <span className="font-mono">{dossier.code ?? dossier.id}</span>
                    {dossier.ville && <><span className="text-slate-300"> · </span>{dossier.ville}</>}
                  </p>
                </TableCell>
                <TableCell className="w-[150px]">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                    /ouvert|qualit/i.test(dossier.phase)
                      ? "bg-emerald-50 text-emerald-700"
                      : /dépôt|depot|agrément|agrement/i.test(dossier.phase)
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                  }`}>
                    {dossier.phase}
                  </span>
                </TableCell>
                <TableCell className="w-[110px] text-center">
                  <span className="text-xs font-semibold tabular-nums text-[#EA5B2D]">{dossier.joursInactif} j</span>
                </TableCell>
                <TableCell className="w-[70px] text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenDossier?.(dossier.id); }}
                    className="p-1.5 rounded-lg text-slate-400 group-hover:text-[#EA5B2D] group-hover:bg-[#EA5B2D]/10 transition-all cursor-pointer inline-flex items-center justify-center"
                    title="Voir le dossier"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {displayedDossiers.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-12 text-center text-sm text-[#5A5A7A] font-semibold">
                  Aucun dossier en alerte — tout est à jour.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </DataTable>
      </div>
      
      {/* Pagination indicators / footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t border-slate-100">
        <span className="text-[10px] font-extrabold text-[#5A5A7A] uppercase tracking-wider">
          Affichage de {totalItems > 0 ? startIndex + 1 : 0} à {Math.min(endIndex, totalItems)} sur {totalItems} dossiers
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-150 flex items-center gap-1 cursor-pointer ${
              currentPage === 1
                ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                : "bg-white border border-slate-200 text-[#2D2A56] hover:bg-slate-50 active:scale-95 shadow-sm"
            }`}
          >
            Précédent
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`h-7 w-7 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                currentPage === page
                  ? "bg-[#2D2A56] text-white shadow-sm"
                  : "bg-white border border-slate-200 text-[#2D2A56] hover:bg-slate-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-150 flex items-center gap-1 cursor-pointer ${
              currentPage === totalPages
                ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                : "bg-white border border-slate-200 text-[#2D2A56] hover:bg-slate-50 active:scale-95 shadow-sm"
            }`}
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

