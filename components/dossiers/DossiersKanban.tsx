"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar } from "lucide-react";
import { type Dossier } from "@/lib/features/dossiers";

export interface KanbanColumn {
  /** etape_pipeline slug — matches a pipeline phase `name` from the settings catalog. */
  key: string;
  /** Human display label (from the pipeline phase `label`). */
  label: string;
}

interface DossiersKanbanProps {
  filteredDossiers: Dossier[];
  /** Board columns, driven by the dynamic pipeline catalog (settings page), in order. */
  columns: KanbanColumn[];
  draggedId: string | null;
  activeDropCol: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, colName: string) => void;
  onDragEnter: (e: React.DragEvent, colName: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetCol: string) => void;
  onOpenDossier?: (id: string) => void;
}

export default function DossiersKanban({
  filteredDossiers,
  columns,
  draggedId,
  activeDropCol,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onOpenDossier
}: DossiersKanbanProps) {
  return (
    <motion.div
      key="kanban"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex gap-4 overflow-x-auto pb-4 w-full select-none"
    >
      {columns.map((column) => {
        // Group by the dossier's actual pipeline stage (etape_pipeline), which maps 1:1
        // to a pipeline phase `name` configured on the settings page.
        const columnDossiers = filteredDossiers.filter((d) => d.etape === column.key);
        const isHovered = activeDropCol === column.key;

        return (
          <div
            key={column.key}
            onDragOver={(e) => onDragOver(e, column.key)}
            onDragEnter={(e) => onDragEnter(e, column.key)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, column.key)}
            className={`w-72 shrink-0 flex flex-col rounded-2xl p-4 transition-all duration-200 ${
              isHovered
                ? "bg-[#E34F2D]/5 border-2 border-dashed border-[#E34F2D]/40 scale-[1.01]"
                : "bg-slate-100/60 border border-slate-200/40"
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A5A7A]">
                {column.label}
              </span>
              <span className="text-[10px] font-extrabold text-slate-400">{columnDossiers.length}</span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1.5 custom-scrollbar min-h-[300px]">
              {columnDossiers.map((dossier) => {
                const dragId = dossier.dossierId ?? dossier.id;
                return (
                  <div
                    key={dragId}
                    draggable
                    onDragStart={(e) => onDragStart(e, dragId)}
                    onClick={() => onOpenDossier?.(dossier.id)}
                    className={`bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer active:cursor-grabbing ${
                      draggedId === dragId ? "opacity-40 scale-95" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono font-extrabold text-[10px] text-[#332151] leading-none">
                        {dossier.code ?? dossier.id}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug mb-3">
                      {dossier.centre}
                    </h4>
                    <div className="space-y-1.5 border-t border-slate-100 pt-2 text-[10px] text-slate-500 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{dossier.ville || "Non disponible"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Créé le {dossier.signatureDate}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {columnDossiers.length === 0 && (
                <div className="h-32 border-2 border-dashed border-slate-200 bg-white/40 rounded-xl flex items-center justify-center text-center p-4 select-none">
                  <span className="text-xs font-bold text-slate-400">Aucun dossier</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
