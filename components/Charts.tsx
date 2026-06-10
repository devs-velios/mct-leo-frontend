"use client";

import TrendChart from "@/components/dashboard/TrendChart";
import DistributionDonuts from "@/components/dashboard/DistributionDonuts";
import DocumentTracking from "@/components/dashboard/DocumentTracking";
import RemindersByDueDate from "@/components/dashboard/RemindersByDueDate";
import PipelineKanban from "@/components/dashboard/PipelineKanban";
import { useDashboardContext } from "@/lib/features/dashboard/DashboardProvider";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Charts({ onOpenDossier }: { onOpenDossier?: (id: string) => void }) {
  const { isLoading } = useDashboardContext();

  if (isLoading) {
    return (
      <div className="space-y-4 lg:space-y-5">
        <div>
          <Skeleton className="mb-2 h-3 w-40" />
          <Skeleton className="h-6 w-56" />
        </div>
        <Skeleton className="h-80 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5 xl:gap-6">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-5 xl:space-y-6">
      {/* Section header */}
      <div>
        <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#E34F2D]">
          <span>Données &amp; Performance</span>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E34F2D]" />
          <span className="font-bold text-[#332151]">Analyses</span>
        </div>
        <h3 className="font-serif-mct text-base sm:text-xl font-bold text-[#332151]">Analytics &amp; Insights</h3>
      </div>

      {/* 1. Full-width trend chart with period selector */}
      <TrendChart />

      {/* 2. Two distribution donuts (above the pipeline board) */}
      <DistributionDonuts />

      {/* 3. Center-level pipeline view — Kanban board by regulatory stage */}
      <PipelineKanban onOpenDossier={onOpenDossier} />

      {/* 4. Document tracking + reminders by due date */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5 xl:gap-6">
        <DocumentTracking />
        <RemindersByDueDate />
      </div>
    </div>
  );
}
