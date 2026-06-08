"use client";

import { useState } from "react";
import { Check, GripVertical, AlertTriangle } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export interface StageDef { key: string; label: string; }

// Canonical micro pipeline — mirrors the backend (pipeline.service.ts).
export const MICRO_STAGES: StageDef[] = [
  { key: "signature_validee", label: "Signature validée" },
  { key: "plans_valides", label: "Plans validés" },
  { key: "installation_qualite", label: "Installation & Qualité" },
  { key: "audit", label: "Audit initial" },
  { key: "depot_agrement", label: "Dépôt d'agrément" },
  { key: "agrement_recu", label: "Agrément reçu" },
  { key: "ouverture", label: "Ouvert" },
];
export const MICRO_KEYS = MICRO_STAGES.map((s) => s.key);
const MICRO_LABEL: Record<string, string> = Object.fromEntries(MICRO_STAGES.map((s) => [s.key, s.label]));

export const microNext = (k: string) => { const i = MICRO_KEYS.indexOf(k); return i >= 0 && i < MICRO_KEYS.length - 1 ? MICRO_KEYS[i + 1] : null; };
export const microPrev = (k: string) => { const i = MICRO_KEYS.indexOf(k); return i > 0 ? MICRO_KEYS[i - 1] : null; };
export const microToMacro = (k: string): string => {
  if (k === "audit") return "audit";
  if (k === "depot_agrement" || k === "agrement_recu") return "agrement_en_cours";
  if (k === "ouverture") return "ouvert";
  return "onboarding";
};

// Macro = a grouping of micro stages (1-3, 4, 5-6, 7) → 4 columns.
const MACRO_GROUPS: { key: string; label: string; micros: string[] }[] = [
  { key: "onboarding", label: "Onboarding", micros: ["signature_validee", "plans_valides", "installation_qualite"] },
  { key: "audit", label: "Audit initial", micros: ["audit"] },
  { key: "agrement_en_cours", label: "Agrément en cours", micros: ["depot_agrement", "agrement_recu"] },
  { key: "ouvert", label: "Ouvert", micros: ["ouverture"] },
];

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
 * Unified pipeline view for a dossier — micro (draggable, fine-grained) and macro (read-only,
 * grouped from the micro stages). Kept in one component because the macro is derived from the
 * micro stage, so they share the same source of truth.
 */
export default function PipelineBoards({ etape, statut, nextStage, prevStage, code, centre, onMove }: PipelineBoardsProps) {
  const movableKeys = new Set([nextStage, prevStage].filter(Boolean) as string[]);

  const currentMicroIdx = etape ? MICRO_KEYS.indexOf(etape) : -1;
  const isBlocked = statut === "bloque";
  // bloque overwrites macro → derive the linear macro from the (preserved) micro stage.
  const currentMacro = isBlocked ? microToMacro(etape ?? "") : statut;

  return (
    <>
      {/* ── MICRO — draggable, fine-grained ─────────────────────────────────── */}
      <div className="lg:col-span-3">
        <MicroBoard currentKey={etape} movableKeys={movableKeys} onMove={onMove} cardCode={code} cardName={centre} />
      </div>

      {/* ── MACRO — read-only, grouped from the micro stages ────────────────── */}
      <div className="lg:col-span-3 bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(45,42,86,0.02)]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-3">
          <div className="min-w-0">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#5A5A7A]">Statut macro — vue d&apos;ouverture</span>
            <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">Lecture seule — regroupe les étapes micro</span>
          </div>
        </div>

        {/* Macro status — static table (grouped from the micro stages) */}
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-auto px-0 py-2 text-[9px]">Statut</TableHead>
                <TableHead className="h-auto px-0 py-2 text-[9px]">Étapes micro</TableHead>
                <TableHead className="h-auto px-0 py-2 text-right text-[9px]">État</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MACRO_GROUPS.map((group) => {
                const isCurrentGroup = !isBlocked && group.key === currentMacro;
                const groupDone = currentMicroIdx >= 0 && group.micros.every((m) => MICRO_KEYS.indexOf(m) < currentMicroIdx);
                return (
                  <TableRow key={group.key} className={`hover:bg-transparent ${isCurrentGroup ? "bg-[#E34F2D]/5" : ""}`}>
                    <TableCell className="px-0 py-2.5 font-bold text-[#332151]">{group.label}</TableCell>
                    <TableCell className="px-0 py-2.5 text-[10px] font-semibold text-slate-500">{group.micros.map((m) => MICRO_LABEL[m]).join(" · ")}</TableCell>
                    <TableCell className="px-0 py-2.5 text-right">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${isCurrentGroup ? "bg-amber-50 text-amber-700" : groupDone ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {isCurrentGroup ? "En cours" : groupDone ? "Terminé" : "À venir"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className={`hover:bg-transparent ${isBlocked ? "bg-rose-50" : ""}`}>
                <TableCell className={`px-0 py-2.5 font-bold ${isBlocked ? "text-rose-600" : "text-slate-500"}`}>Bloqué</TableCell>
                <TableCell className="px-0 py-2.5 text-[10px] font-semibold text-slate-400">—</TableCell>
                <TableCell className="px-0 py-2.5 text-right">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${isBlocked ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                    {isBlocked ? "Bloqué" : "Non bloqué"}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
      </div>
    </>
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
  const currentIdx = MICRO_STAGES.findIndex((s) => s.key === currentKey);
  const [dragging, setDragging] = useState(false);
  const [overKey, setOverKey] = useState<string | null>(null);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5A5A7A]">Étapes du dossier — pipeline détaillé</span>
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Glissez la fiche vers une étape adjacente</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 custom-scrollbar">
        {MICRO_STAGES.map((s, idx) => {
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
