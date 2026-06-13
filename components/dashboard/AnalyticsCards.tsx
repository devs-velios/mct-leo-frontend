"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, OctagonAlert, FileCheck2, AlarmClock, Gauge } from "lucide-react";
import { useDashboardContext } from "@/lib/features/dashboard/DashboardProvider";
import { dashboardMetrics, networkCompletion } from "@/lib/features/dashboard";
import { usePiecesContext, queueItemToValidation } from "@/lib/features/pieces";
import { useRemindersContext, remindersByDueBucket } from "@/lib/features/reminders";
import { Stats, type StatItem } from "@/components/ui/stats";

export default function AnalyticsCards() {
  const router = useRouter();
  const { stats } = useDashboardContext();
  const { queue, ensureQueue } = usePiecesContext();
  const { reminders, ensureLoaded: ensureReminders } = useRemindersContext();
  const loading = stats == null;

  // Both are independent + cache-guarded → fire in parallel from one effect.
  useEffect(() => { void Promise.all([ensureQueue(), ensureReminders()]); }, [ensureQueue, ensureReminders]);
  // Capture "now" once after mount so render stays pure.
  const [now, setNow] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setNow(Date.now()); }, []);

  const fmt = (n: number | undefined) => (stats == null ? "" : String(n ?? 0));
  const { piecesPending, openCentres } = dashboardMetrics(stats);
  const completion = networkCompletion(stats);
  const blocked = stats?.centres.by_statut?.bloque ?? 0;

  // Pending pieces with a low AI confidence (< 70 %) — derived from the live queue.
  const lowConfidence = useMemo(
    () =>
      queue
        .map(queueItemToValidation)
        .filter((v) => (v.status === "À valider" || v.status === "À identifier") && v.confIA < 70).length,
    [queue],
  );

  // Active reminders: pending ones still scheduled to fire (upcoming) — excludes the
  // overdue bucket. Sum of all buckets after "En retard".
  const activeReminders = useMemo(
    () => (now == null ? 0 : remindersByDueBucket(reminders, now).buckets.slice(1).reduce((s, b) => s + b.value, 0)),
    [reminders, now],
  );

  const items: StatItem[] = [
    {
      label: "Centres actifs",
      value: fmt(stats?.centres.total),
      subtext: stats ? `${openCentres} ouvert${openCentres > 1 ? "s" : ""}` : undefined,
      icon: Store,
      loading,
      onClick: () => router.push("/dashboard/centres"),
    },
    {
      label: "Dossiers bloqués",
      value: fmt(blocked),
      // TODO(backend): expose average time-to-unblock in the dashboard stats payload.
      subtext: "Délai moyen de déblocage : —",
      icon: OctagonAlert,
      loading,
      // Just open the dossiers list (no statut=bloque filter — the list filter keys
      // off a different field and would show an empty "no match" state).
      onClick: () => router.push("/dashboard/dossiers"),
    },
    {
      label: "Documents à valider",
      value: fmt(piecesPending),
      subtext: `dont ${lowConfidence} en faible confiance`,
      icon: FileCheck2,
      highlight: piecesPending > 0,
      loading,
      onClick: () => router.push("/dashboard/validations"),
    },
    {
      label: "Rappels actifs",
      value: fmt(activeReminders),
      subtext: activeReminders > 0 ? "programmés à venir" : "aucun à venir",
      icon: AlarmClock,
      loading,
      onClick: () => router.push("/dashboard/rappels"),
    },
    {
      label: "Complétude réseau",
      value: stats == null ? "" : `${completion.pct}%`,
      subtext: stats ? `${completion.active}/${completion.started} centres actifs` : undefined,
      icon: Gauge,
      loading,
      onClick: () => router.push("/dashboard/centres"),
    },
  ];

  return <Stats items={items} />;
}
