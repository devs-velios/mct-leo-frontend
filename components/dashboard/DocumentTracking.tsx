"use client";

import { FileStack } from "lucide-react";
import { Panel, EmptyState } from "./Panel";
import { useDashboardContext } from "@/lib/features/dashboard/DashboardProvider";
import { dashboardMetrics } from "@/lib/features/dashboard";
import { FunnelChart, type FunnelStage } from "@/components/ui/funnel-chart";

export default function DocumentTracking() {
  const { stats } = useDashboardContext();
  const total = stats?.pieces.total ?? 0;
  const verified = stats?.pieces.verified ?? 0;
  const { piecesPending: pending, pctVerified } = dashboardMetrics(stats);

  // Pièces collection as a funnel: Reçues → À valider → Validées. Single cohesive
  // brand-orange tonal funnel (the layered rings give depth; one hue reads as one
  // flowing funnel and keeps the on-segment labels legible).
  const funnelData: FunnelStage[] = [
    { label: "Reçues", value: total, displayValue: String(total) },
    { label: "À valider", value: pending, displayValue: String(pending) },
    { label: "Validées", value: verified, displayValue: String(verified) },
  ];

  return (
    <Panel
      eyebrow="Collecte documentaire"
      title="Suivi des pièces"
      subtitle="Réception et validation des documents"
      actions={
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-[#5A5A7A] tabular-nums">
          {pctVerified}% validées
        </span>
      }
    >
      {total === 0 ? (
        <EmptyState icon={FileStack} message="Aucune pièce reçue" hint="Les documents apparaîtront ici une fois déposés." />
      ) : (
        <div className="space-y-5">
          {/* Validation progress — single neutral bar */}
          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#5A5A7A]">Progression de validation</span>
              <span className="tabular-nums text-[#332151]">{verified}/{total}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#332151] transition-[width] duration-300" style={{ width: `${pctVerified}%` }} />
            </div>
          </div>

          {/* Breakdown — animated funnel (Reçues → À valider → Validées) */}
          <div className="border-t border-slate-100 pt-2">
            <FunnelChart
              data={funnelData}
              color="#E34F2D"
              layers={3}
              gap={6}
              grid={false}
              showPercentage={false}
              labelLayout="grouped"
              labelOrientation="vertical"
              labelAlign="center"
              valueClassName="text-white text-xl font-bold drop-shadow-sm"
              labelClassName="text-white/90 text-[10px] font-bold uppercase tracking-wider"
            />
          </div>
        </div>
      )}
    </Panel>
  );
}
