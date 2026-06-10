"use client";

import { PieChart } from "lucide-react";
import { DonutChart } from "@/components/ui/donut-chart";
import { Panel, EmptyState } from "./Panel";
import { useDashboardContext } from "@/lib/features/dashboard/DashboardProvider";
import { centreStatutSegments, dossierStageSegments } from "@/lib/features/dashboard";

// Monochrome brand ramps — Centres use the orange family, Dossiers the indigo
// family, so the two donuts read as clearly different (and stay on-brand).
const ORANGE_RAMP = ["#E34F2D", "#EA5835", "#F08362", "#F4A98F", "#F8CABB"];
const INDIGO_RAMP = ["#332151", "#4B2F5E", "#664A78", "#8A749B", "#B3A3C1"];

type Seg = { value: number; color: string; label: string };

function Donut({
  eyebrow,
  title,
  subtitle,
  segments,
  total,
  centerLabel,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  segments: Seg[];
  total: number;
  centerLabel: string;
}) {
  return (
    <Panel eyebrow={eyebrow} title={title} subtitle={subtitle}>
      {total === 0 ? (
        <EmptyState icon={PieChart} message="Aucune donnée à répartir" />
      ) : (
        <>
          <div className="flex h-48 w-full items-center justify-center">
            <DonutChart
              data={segments}
              size={170}
              strokeWidth={20}
              animationDuration={0.8}
              animationDelayPerSegment={0.04}
              highlightOnHover
              centerContent={
                <div className="pointer-events-none flex select-none flex-col items-center text-center">
                  <span className="font-serif-mct text-4xl font-extrabold leading-none text-[#332151]">
                    {total}
                  </span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {centerLabel}
                  </span>
                </div>
              }
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1.5 border-t border-slate-50 pt-3 text-[9px] font-bold uppercase">
            {segments.map((s) => (
              <span key={s.label} className="flex items-center gap-1.5 text-[#5A5A7A]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label} ({s.value})
              </span>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

export default function DistributionDonuts() {
  const { stats } = useDashboardContext();

  // Segment values + labels derive from the dashboard feature; the view assigns colours.
  const centresSegs: Seg[] = centreStatutSegments(stats).map((s, i) => ({
    ...s,
    color: ORANGE_RAMP[i % ORANGE_RAMP.length],
  }));
  const centresTotal = centresSegs.reduce((s, d) => s + d.value, 0);

  const stageSegs: Seg[] = dossierStageSegments(stats).map((s, i) => ({
    ...s,
    color: INDIGO_RAMP[i % INDIGO_RAMP.length],
  }));
  const stageTotal = stageSegs.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5 xl:gap-6">
      <Donut
        eyebrow="Répartition"
        title="Centres par statut"
        subtitle="Répartition du réseau"
        segments={centresSegs}
        total={centresTotal}
        centerLabel="Centres"
      />
      <Donut
        eyebrow="Répartition"
        title="Dossiers par phase"
        subtitle="Position dans le pipeline"
        segments={stageSegs}
        total={stageTotal}
        centerLabel="Dossiers"
      />
    </div>
  );
}
