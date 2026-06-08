"use client";

import { Folder, Bell, FileText, Building } from "lucide-react";
import { useDashboardContext } from "@/lib/features/dashboard/DashboardProvider";

export default function AnalyticsCards() {
  const { stats } = useDashboardContext();
  const loading = stats == null;

  const fmt = (n: number | undefined) => (stats == null ? "" : String(n ?? 0));
  const openCentres = stats?.centres.by_statut?.ouvert ?? 0;
  const cards: { title: string; value: string; icon: typeof Folder; sub?: string }[] = [
    { title: "Dossiers actifs", value: fmt(stats?.dossiers.total), icon: Folder },
    {
      title: "Pièces en attente",
      value: fmt(stats ? stats.pieces.total - stats.pieces.verified : undefined),
      icon: FileText,
    },
    { title: "Rappels en attente", value: fmt(stats?.pending_reminders), icon: Bell },
    {
      title: "Centres",
      value: fmt(stats?.centres.total),
      icon: Building,
      sub: stats ? `${openCentres} ouvert${openCentres > 1 ? "s" : ""}` : undefined,
    },
  ];

  return (
    <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">{card.title}</p>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#2D2A56]">
                <Icon className="h-4.5 w-4.5" />
              </div>
            </div>
            <h3 className="mt-3 text-3xl font-bold leading-none text-[#2D2A56]">
              {loading ? <span className="inline-block h-8 w-14 animate-pulse rounded-lg bg-slate-200/70" /> : card.value}
            </h3>
            {!loading && card.sub && <p className="mt-1.5 text-[10px] font-semibold text-slate-400">{card.sub}</p>}
          </div>
        );
      })}
    </div>
  );
}
