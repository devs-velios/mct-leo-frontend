"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch } from "lucide-react";
import { Panel, EmptyState } from "./Panel";
import { FunnelChart, type FunnelStage } from "@/components/ui/funnel-chart";
import { usePipelineContext } from "@/lib/features/pipeline";
import { useCentresContext } from "@/lib/features/centres";
import { pipelineFunnel, FUNNEL_COLORS } from "@/lib/features/dashboard";

/**
 * Full-width funnel by pipeline phase, rendered with the shared FunnelChart. Data
 * comes from the dynamic pipeline catalog (phases are add/removable), and each
 * phase's value is the number of centres that have REACHED AT LEAST that phase
 * (cumulative), so the funnel always decreases. The hovered segment is tracked so
 * a click navigates to the filtered dossiers list.
 */
export default function PhaseFunnel() {
  const router = useRouter();
  const { phases, ensureLoaded } = usePipelineContext();
  const { centres, ensureList } = useCentresContext();
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);

  const steps = useMemo(
    () => pipelineFunnel(phases, centres.map((c) => c.etape_pipeline)),
    [phases, centres],
  );
  const stages: FunnelStage[] = steps.map((s, i) => ({
    label: s.label,
    value: s.value,
    color: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
  }));
  const total = steps.reduce((sum, s) => sum + s.value, 0);

  const go = (i: number | null) => {
    if (i == null || !steps[i]) return;
    router.push(`/dashboard/dossiers?etape=${encodeURIComponent(steps[i].name)}`);
  };

  return (
    <Panel title="Funnel par phase" subtitle="Centres ayant atteint au moins chaque phase du pipeline">
      {steps.length === 0 || total === 0 ? (
        <EmptyState icon={GitBranch} message="Aucune donnée de pipeline" hint="Les phases se chargent…" />
      ) : (
        <>
          {/* On small screens the in-segment labels overlap, so they're hidden there and
              the hovered phase name is shown here instead. */}
          <div className="mb-2 h-5 text-center text-xs font-bold text-[#332151] sm:hidden">
            {hovered != null && steps[hovered]
              ? `${steps[hovered].label} · ${steps[hovered].value}`
              : <span className="font-medium text-slate-400">Survolez une phase pour voir son nom</span>}
          </div>
          <div
            onClick={() => go(hovered)}
            className="h-72 w-full cursor-pointer"
            title="Cliquer un segment pour voir les dossiers de cette phase"
          >
            <FunnelChart
              data={stages}
              orientation="horizontal"
              layers={1}
              showPercentage={false}
              showValues
              minSegment={0.5}
              labelLayout="grouped"
              labelAlign="center"
              valueClassName="text-white font-extrabold"
              // Wrap long phase names DOWN inside the segment (sm+); hidden below sm where
              // they overlap — the caption above shows the hovered phase name instead.
              // `!whitespace-normal` + a fixed `w-[…]` (block) guarantees the text wraps to
              // the next line instead of spilling into the neighbouring segment.
              labelClassName="text-white font-bold !whitespace-normal break-words text-center leading-tight text-[11px] block w-[130px] px-1 max-sm:hidden"
              hoveredIndex={hovered}
              onHoverChange={setHovered}
              className="h-full w-full"
            />
          </div>
        </>
      )}
    </Panel>
  );
}
