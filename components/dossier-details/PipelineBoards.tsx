"use client";

import { useState } from "react";
import { Check, GripVertical } from "lucide-react";
import { MICRO_STAGES, microNext, microPrev } from "@/lib/features/dossiers";

interface PipelineBoardsProps {
  etape: string | null | undefined;        // current micro stage
  statut: string | null | undefined;       // current macro status (may be "bloque")
  nextStage: string | null | undefined;
  prevStage: string | null | undefined;
  code: string;
  centre: string;
  onMove: (target: string) => void;        // advance/revert (adjacent only)
}

/**
 * Single pipeline visualization for a dossier — the micro (draggable, fine-grained) board.
 */
export default function PipelineBoards({ etape, nextStage, prevStage, code, centre, onMove }: PipelineBoardsProps) {
  // Adjacent (droppable) stages. Prefer the backend's next/prev; fall back to the
  // canonical local order so drag-to-advance works even when the backend doesn't
  // return adjacency for the current pipeline.
  const adjacent = [nextStage, prevStage].filter(Boolean) as string[];
  const localAdjacent = [microNext(etape ?? ""), microPrev(etape ?? "")].filter(Boolean) as string[];
  const movableKeys = new Set(adjacent.length ? adjacent : localAdjacent);

  return (
    <div className="lg:col-span-3">
      {/* ── MICRO — draggable, fine-grained (single pipeline visualization) ──── */}
      <MicroBoard currentKey={etape} movableKeys={movableKeys} onMove={onMove} cardCode={code} cardName={centre} />
    </div>
  );
}

// ── Micro board — draggable kanban (drag-only; adjacent columns are drop targets) ──────────
function MicroBoard({
  currentKey,
  movableKeys,
  onMove,
  cardCode,
  cardName,
}: {
  currentKey: string | null | undefined;
  movableKeys: Set<string>;
  onMove: (key: string) => void;
  cardCode: string;
  cardName: string;
}) {
  const stages = MICRO_STAGES;
  const currentIdx = stages.findIndex((s) => s.key === currentKey);
  const [dragging, setDragging] = useState(false);
  const [overKey, setOverKey] = useState<string | null>(null);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5A5A7A]">Étapes du dossier — pipeline détaillé</span>
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Glissez la fiche vers une étape adjacente</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 custom-scrollbar">
        {stages.map((s, idx) => {
          const isCurrent = s.key === currentKey;
          const isDone = currentIdx >= 0 && idx < currentIdx;
          const movable = movableKeys.has(s.key);
          const isOver = overKey === s.key && movable;
          return (
            <div
              key={s.key}
              onDragOver={movable ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOverKey(s.key); } : undefined}
              onDragLeave={movable ? () => setOverKey((k) => (k === s.key ? null : k)) : undefined}
              onDrop={movable ? (e) => { e.preventDefault(); setOverKey(null); setDragging(false); onMove(s.key); } : undefined}
              className={`w-64 shrink-0 flex flex-col rounded-2xl p-4 transition-all duration-200 ${
                isOver
                  ? "bg-[#E34F2D]/5 border-2 border-dashed border-[#E34F2D]/40 scale-[1.01]"
                  : isCurrent
                  ? "bg-white border border-[#E34F2D]/30"
                  : "bg-slate-100/60 border border-slate-200/40"
              }`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A5A7A]">{s.label}</span>
                {isDone ? <Check className="h-3.5 w-3.5 text-slate-400 shrink-0" /> : isCurrent ? <span className="h-1.5 w-1.5 rounded-full bg-[#E34F2D] shrink-0" /> : null}
              </div>

              {/* Card slot */}
              {isCurrent ? (
                <div
                  draggable
                  onDragStart={(e) => { setDragging(true); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", s.key); }}
                  onDragEnd={() => { setDragging(false); setOverKey(null); }}
                  className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono font-extrabold text-[10px] text-[#332151] leading-none">{cardCode}</span>
                    <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 leading-snug">{cardName}</h4>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#E34F2D]">Étape en cours</p>
                </div>
              ) : (
                <div className={`flex-1 min-h-[120px] rounded-xl border-2 border-dashed flex items-center justify-center text-center p-4 ${
                  isOver ? "border-[#E34F2D]/40 bg-[#E34F2D]/[0.03]"
                  : movable ? "border-slate-200 bg-white/50"
                  : "border-transparent"
                }`}>
                  <span className={`text-xs font-bold ${isOver ? "text-[#E34F2D]" : "text-slate-400"}`}>
                    {movable ? "Déposer ici" : isDone ? "Terminé" : "—"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
