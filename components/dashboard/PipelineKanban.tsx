"use client";

import { useEffect, useMemo } from "react";
import { MapPin, GitBranch } from "lucide-react";
import { Panel, EmptyState } from "./Panel";
import { useDossiersContext, dossierToRow, groupDossiersByStage, MICRO_STAGES as COLUMNS } from "@/lib/features/dossiers";

export default function PipelineKanban({ onOpenDossier }: { onOpenDossier?: (id: string) => void }) {
  const { dossiers, ensureLoaded } = useDossiersContext();

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);

  // Group by the onboarding (micro) pipeline — the etape_pipeline the backend returns.
  const grouped = useMemo(() => groupDossiersByStage(dossiers.map(dossierToRow), COLUMNS), [dossiers]);

  const total = dossiers.length;

  return (
    <Panel
      eyebrow="Pipeline"
      title="Pipeline d'agrément"
      subtitle="Centres à chaque étape du parcours réglementaire"
      actions={
        <span className="rounded-lg bg-[#332151]/5 px-2.5 py-1 text-[11px] font-bold text-[#332151] tabular-nums">
          {total} centre{total > 1 ? "s" : ""}
        </span>
      }
      bodyClassName="min-w-0"
    >
      {total === 0 ? (
        <EmptyState icon={GitBranch} message="Aucun centre dans le pipeline" hint="Les étapes se rempliront dès qu'un dossier progresse." />
      ) : (
        <div className="custom-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {COLUMNS.map((col, idx) => {
            const items = grouped[col.key] ?? [];
            return (
              <div key={col.key} className="flex w-[240px] shrink-0 flex-col rounded-2xl bg-slate-50/70 p-2.5">
                {/* Column header */}
                <div className="mb-2.5 flex items-center justify-between gap-2 px-1.5 pt-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-[10px] font-bold tabular-nums text-slate-300">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate text-[11px] font-extrabold uppercase tracking-wide text-[#332151]">
                      {col.label}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-[#5A5A7A]">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2">
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-[10px] font-semibold text-slate-300">
                      Aucun centre
                    </div>
                  ) : (
                    items.map((item) => (
                      <button
                        key={item.dossierId ?? item.id}
                        type="button"
                        onClick={() => onOpenDossier?.(item.id)}
                        className="group w-full rounded-xl border border-slate-100 bg-white p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-150 hover:border-[#E34F2D]/40 hover:shadow-[0_6px_18px_rgba(45,42,86,0.06)]"
                      >
                        <p className="truncate text-xs font-bold leading-tight text-[#332151] group-hover:text-[#E34F2D]">
                          {item.centre}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-[#5A5A7A]">
                          {item.code && <span className="font-mono text-[#332151]">{item.code}</span>}
                          {item.code && item.ville && <span className="text-slate-300">•</span>}
                          {item.ville && (
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-3 w-3 opacity-60" />
                              {item.ville}
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
