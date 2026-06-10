"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { List, Kanban as KanbanIcon } from "lucide-react";
import DossiersTable from "./DossiersTable";
import DossiersKanban from "./DossiersKanban";
import { useDossiersContext, type Dossier, dossierToRow } from "@/lib/features/dossiers";
import { SkeletonTable } from "@/components/ui/Skeleton";

/**
 * The convertible pipeline view (Tableau ⇄ Kanban) from the Dossiers page, packaged for
 * reuse (e.g. inside the dossier detail hub). Loads all dossiers and reuses DossiersTable
 * + DossiersKanban as-is.
 */
export default function DossiersBoard({ onOpenDossier }: { onOpenDossier?: (id: string) => void }) {
  const { dossiers, isLoading, ensureLoaded, advance } = useDossiersContext();
  const [dossiersList, setDossiersList] = useState<Dossier[]>([]);
  const [viewMode, setViewMode] = useState<"tableau" | "kanban">("kanban");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
  useEffect(() => { setDossiersList(dossiers.map(dossierToRow)); }, [dossiers]);

  const handleAdvance = async (dossierId: string, direction: "next" | "back") => {
    try { await advance(dossierId, { direction }); } catch { /* 422 at ends */ }
  };

  // HTML5 drag-and-drop (kanban) — same handlers as the Dossiers page.
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDragEnter = (e: React.DragEvent, colName: string) => { e.preventDefault(); setActiveDropCol(colName); };
  const handleDragLeave = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent, targetCol: Dossier["phase"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (id) setDossiersList((prev) => prev.map((d) => (d.id === id ? { ...d, phase: targetCol } : d)));
    setDraggedId(null);
    setActiveDropCol(null);
  };

  const totalItems = dossiersList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedDossiers = dossiersList.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-5 shadow-[0_8px_30px_rgba(45,42,86,0.02)]">
      {/* Header + Tableau/Kanban toggle */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5A5A7A]">Pipeline des dossiers</span>
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode("tableau")}
            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              viewMode === "tableau" ? "bg-white text-[#332151] shadow-sm" : "text-[#5A5A7A] hover:text-slate-800 hover:bg-white"
            }`}
          >
            <List className="h-3.5 w-3.5" /> Tableau
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              viewMode === "kanban" ? "bg-white text-[#332151] shadow-sm" : "text-[#5A5A7A] hover:text-slate-800 hover:bg-white"
            }`}
          >
            <KanbanIcon className="h-3.5 w-3.5" /> Kanban
          </button>
        </div>
      </div>

      {isLoading && dossiersList.length === 0 ? (
        <SkeletonTable rows={6} cols={5} />
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
            />
          ) : (
            <DossiersKanban
              filteredDossiers={dossiersList}
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
  );
}
