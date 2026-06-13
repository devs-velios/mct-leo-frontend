"use client";

import { useEffect, useMemo } from "react";
import { PieChart } from "lucide-react";
import { DonutChart } from "@/components/ui/donut-chart";
import { Panel, EmptyState } from "./Panel";
import { useCentresContext } from "@/lib/features/centres";
import { usePipelineContext } from "@/lib/features/pipeline";
import { centreStatutSegmentsFromCentres, contratSegments, activiteBars } from "@/lib/features/dashboard";

// Distinct solid colours per centre statut (no monochrome ramp).
const STATUT_COLORS: Record<string, string> = {
  Onboarding: "#332151",
  Audit: "#2563EB",
  "Agrément en cours": "#D97706",
  Ouvert: "#059669",
  Bloqué: "#E11D48",
};
const STATUT_FALLBACK = ["#332151", "#2563EB", "#D97706", "#059669", "#E11D48", "#7C3AED"];

// Contract type — indigo (R) / orange (P) per the brand spec.
const CONTRAT_COLORS = ["#332151", "#E34F2D", "#2563EB", "#059669"];

// One colour per activity (VL / CL / PL).
const ACTIVITE_COLORS: Record<string, string> = { VL: "#332151", CL: "#E34F2D", PL: "#2563EB" };
const ACTIVITE_FALLBACK = ["#332151", "#E34F2D", "#2563EB", "#059669"];

type Seg = { value: number; color: string; label: string };

function Donut({ title, subtitle, segments, centerLabel }: { title: string; subtitle: string; segments: Seg[]; centerLabel: string }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  return (
    <Panel title={title} subtitle={subtitle}>
      {total === 0 ? (
        <EmptyState icon={PieChart} message="Aucune donnée à afficher" />
      ) : (
        <>
          <div className="flex h-44 w-full items-center justify-center">
            <DonutChart
              data={segments}
              size={160}
              strokeWidth={20}
              animationDuration={0.8}
              animationDelayPerSegment={0.04}
              highlightOnHover
              centerContent={
                <div className="pointer-events-none flex select-none flex-col items-center text-center">
                  <span className="font-serif-mct text-4xl font-extrabold leading-none text-[#332151]">{total}</span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{centerLabel}</span>
                </div>
              }
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1.5 border-t border-slate-50 pt-3 text-[9px] font-bold uppercase">
            {segments.map((s) => (
              <span key={s.label} className="flex items-center gap-1.5 text-[#5A5A7A]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
                <span className="rounded bg-slate-200/60 px-1 py-0.5 text-[9px] font-black text-[#332151]">{s.value}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

export default function BreakdownRow() {
  const { centres, ensureList } = useCentresContext();
  const { phases, ensureLoaded: ensurePipeline } = usePipelineContext();

  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);
  useEffect(() => { ensurePipeline(); }, [ensurePipeline]);

  // Map each pipeline phase → its macro statut, so a centre's statut can be
  // resolved from where it actually is in the pipeline (not just a stored field).
  const macroByEtape = useMemo(() => new Map(phases.map((p) => [p.name, p.macro_statut])), [phases]);

  const statutSegs: Seg[] = centreStatutSegmentsFromCentres(centres, macroByEtape).map((s, i) => ({
    ...s,
    color: STATUT_COLORS[s.label] ?? STATUT_FALLBACK[i % STATUT_FALLBACK.length],
  }));

  const contratSegs: Seg[] = contratSegments(centres).map((s, i) => ({
    ...s,
    color: CONTRAT_COLORS[i % CONTRAT_COLORS.length],
  }));

  // Activités as donut segments (a centre can combine several → total ≥ centre count).
  const activiteSegs: Seg[] = activiteBars(centres).map((b, i) => ({
    value: b.value,
    label: b.activite,
    color: ACTIVITE_COLORS[b.activite] ?? ACTIVITE_FALLBACK[i % ACTIVITE_FALLBACK.length],
  }));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-5 xl:gap-6">
      <Donut title="Centres par statut" subtitle="Répartition du réseau" segments={statutSegs} centerLabel="Centres" />
      <Donut title="Type de contrat" subtitle="Réseau (R) / Partenaire (P)" segments={contratSegs} centerLabel="Centres" />
      <Donut title="Activités" subtitle="VL / CL / PL — un centre peut en cumuler plusieurs" segments={activiteSegs} centerLabel="Activités" />
    </div>
  );
}
