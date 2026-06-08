"use client";

import { FileStack } from "lucide-react";
import { Panel, EmptyState } from "./Panel";
import { useDashboardContext } from "@/lib/features/dashboard/DashboardProvider";

export default function DocumentTracking() {
  const { stats } = useDashboardContext();
  const total = stats?.pieces.total ?? 0;
  const verified = stats?.pieces.verified ?? 0;
  const pending = Math.max(0, total - verified);
  const pctVerified = total > 0 ? Math.round((verified / total) * 100) : 0;

  const rows = [
    { label: "Reçues", value: total },
    { label: "À valider", value: pending },
    { label: "Validées", value: verified },
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

          {/* Breakdown — plain divided stats */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-4">
            {rows.map((r) => (
              <div key={r.label} className="px-2 text-center">
                <p className="text-2xl font-bold leading-none text-[#332151] tabular-nums">{r.value}</p>
                <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
