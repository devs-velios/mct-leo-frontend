"use client";

import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

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
  onOpenDossier,
}: TableProps) {
  // Compute counts dynamically based on the actual list
  const countTous = dossiersList.length;
  const countCritiques = dossiersList.filter((d) => d.joursInactif >= 5).length;
  const countOnboarding = dossiersList.filter((d) => d.phase === "Onboarding").length;
  const countAgrement = dossiersList.filter((d) => d.phase === "Dépôt Agrément").length;

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
  const displayedDossiers = filteredDossiers.slice(startIndex, startIndex + itemsPerPage);

  const columns: DataTableColumn<Dossier>[] = [
    {
      id: "dossier",
      header: "Dossier",
      width: "minmax(220px,1fr)",
      cell: (dossier) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold leading-snug text-slate-800 transition-colors group-hover:text-[#E34F2D]">
            {dossier.enseigne}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            <span className="font-mono">{dossier.code ?? dossier.id}</span>
            {dossier.ville && (
              <>
                <span className="text-slate-300"> · </span>
                {dossier.ville}
              </>
            )}
          </p>
        </div>
      ),
    },
    {
      id: "phase",
      header: "Phase",
      width: "150px",
      cell: (dossier) => (
        <span
          className={`inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ${
            /ouvert|qualit/i.test(dossier.phase)
              ? "bg-emerald-50 text-emerald-700"
              : /dépôt|depot|agrément|agrement/i.test(dossier.phase)
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {dossier.phase}
        </span>
      ),
    },
    {
      id: "inactivite",
      header: "Inactivité",
      width: "110px",
      align: "center",
      cell: (dossier) => (
        <span className="text-xs font-semibold tabular-nums text-[#E34F2D]">{dossier.joursInactif} j</span>
      ),
    },
    {
      id: "action",
      header: "Action",
      width: "70px",
      align: "right",
      cell: (dossier) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDossier?.(dossier.id);
          }}
          className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 transition-all hover:bg-[#E34F2D]/10 group-hover:text-[#E34F2D] cursor-pointer"
          title="Voir le dossier"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between overflow-hidden w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E34F2D]">ALERTES</span>
          <h4 className="text-base font-bold font-serif-mct text-[#332151]">Dossiers nécessitant un suivi</h4>
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

      <DataTable<Dossier>
        data={displayedDossiers}
        columns={columns}
        getRowId={(d) => d.id}
        minWidth="520px"
        onRowClick={(d) => onOpenDossier?.(d.id)}
        hideToolbar
        bare
        emptyMessage="Aucun dossier en alerte — tout est à jour."
        pagination={{
          page: currentPage,
          totalPages,
          totalItems,
          numbered: true,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  );
}
