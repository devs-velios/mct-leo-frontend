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
  const { piecesPending: pending } = dashboardMetrics(stats);

  // Pièces collection as a funnel: Reçues → À valider → Validées. Solid segments
  // (no haze) in distinct brand colours — indigo → orange across the journey.
  const funnelData: FunnelStage[] = [
    { label: "Reçues", value: total, displayValue: String(total), color: "#332151" },     // indigo
    { label: "À valider", value: pending, displayValue: String(pending), color: "#EA5835" }, // orange clair
    { label: "Validées", value: verified, displayValue: String(verified), color: "#E34F2D" }, // orange
  ];

  return (
    <Panel
      eyebrow="Collecte documentaire"
      title="Suivi des pièces"
      subtitle="Réception et validation des documents"
    >
      {total === 0 ? (
        <EmptyState icon={FileStack} message="Aucune pièce reçue" hint="Les documents apparaîtront ici une fois déposés." />
      ) : (
        <FunnelChart
          data={funnelData}
          layers={1}
          minSegment={0.55}
          gap={6}
          grid={false}
          showPercentage={false}
          labelLayout="grouped"
          labelOrientation="vertical"
          labelAlign="center"
          valueClassName="text-white text-xl font-bold drop-shadow-sm"
          labelClassName="text-white/90 text-[10px] font-bold uppercase tracking-wider"
        />
      )}
    </Panel>
  );
}
