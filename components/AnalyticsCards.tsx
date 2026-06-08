"use client";

import { Folder, Building, FileText, Bell, AlertTriangle } from "lucide-react";
import { useDashboardContext } from "@/lib/features/dashboard/DashboardProvider";
import { Stats, type StatItem } from "@/components/ui/stats";

export default function AnalyticsCards() {
  const { stats } = useDashboardContext();
  const loading = stats == null;

  const fmt = (n: number | undefined) => (stats == null ? "" : String(n ?? 0));
  const openCentres = stats?.centres.by_statut?.ouvert ?? 0;
  const piecesPending = stats ? stats.pieces.total - stats.pieces.verified : undefined;
  const openAlerts = stats?.open_alerts ?? 0;

  const items: StatItem[] = [
    { label: "Dossiers actifs", value: fmt(stats?.dossiers.total), icon: Folder, loading },
    {
      label: stats ? `Centres · ${openCentres} ouvert${openCentres > 1 ? "s" : ""}` : "Centres",
      value: fmt(stats?.centres.total),
      icon: Building,
      loading,
    },
    { label: "Pièces en attente", value: fmt(piecesPending), icon: FileText, loading },
    { label: "Rappels en attente", value: fmt(stats?.pending_reminders), icon: Bell, loading },
    { label: "Alertes ouvertes", value: fmt(stats?.open_alerts), icon: AlertTriangle, highlight: openAlerts > 0, loading },
  ];

  return <Stats items={items} />;
}
