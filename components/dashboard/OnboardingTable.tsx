"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, OctagonAlert, Inbox } from "lucide-react";
import { Panel, EmptyState } from "./Panel";
import { useCentresContext } from "@/lib/features/centres";
import { usePipelineContext } from "@/lib/features/pipeline";
import { CentreCell } from "@/components/ui/centre-cell";

const DAY = 86_400_000;

export default function OnboardingTable({ onOpenDossier }: { onOpenDossier?: (id: string) => void }) {
  const { centres, ensureList } = useCentresContext();
  const { phases, ensureLoaded } = usePipelineContext();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);
  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setNow(Date.now()); }, []);

  const phaseLabel = useMemo(() => new Map(phases.map((p) => [p.name, p.label])), [phases]);

  // Centres not yet open ("en cours d'onboarding"), most inactive first.
  const rows = useMemo(() => {
    const ref = now ?? Date.now();
    return centres
      .filter((c) => c.statut_ouverture !== "ouvert")
      .map((c) => {
        const last = new Date(c.last_activity_at ?? c.created_at).getTime();
        const days = Number.isNaN(last) ? 0 : Math.max(0, Math.floor((ref - last) / DAY));
        return { c, days, blocked: c.statut_ouverture === "bloque" };
      })
      .sort((a, b) => b.days - a.days)
      .slice(0, 6);
  }, [centres, now]);

  return (
    <Panel title="Onboarding en cours" subtitle="Centres non ouverts, triés par inactivité">
      {rows.length === 0 ? (
        <EmptyState icon={Inbox} message="Aucun centre en onboarding" />
      ) : (
        <div className="flex flex-col divide-y divide-slate-50">
          {rows.map(({ c, days, blocked }) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpenDossier?.(c.id)}
              className="group flex items-center gap-3 py-3 text-left outline-none"
            >
              <div className="min-w-0 flex-1">
                <CentreCell name={c.enseigne} code={c.code_centre} />
              </div>
              <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                {blocked && <OctagonAlert className="h-3.5 w-3.5 text-[#E11D48]" />}
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-[#332151]">
                  {phaseLabel.get(c.etape_pipeline ?? "") ?? "—"}
                </span>
              </span>
              <span className={`w-16 shrink-0 text-right text-xs font-bold tabular-nums ${days >= 5 || blocked ? "text-[#E11D48]" : "text-[#5A5A7A]"}`}>
                {days} j
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#E34F2D]" />
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
}
