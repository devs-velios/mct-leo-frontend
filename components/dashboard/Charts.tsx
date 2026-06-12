"use client";

import TrendChart from "@/components/dashboard/TrendChart";
import PhaseFunnel from "@/components/dashboard/PhaseFunnel";
import BreakdownRow from "@/components/dashboard/BreakdownRow";
import DocumentsPerDay from "@/components/dashboard/DocumentsPerDay";
import RemindersByDueDate from "@/components/dashboard/RemindersByDueDate";
import OnboardingTable from "@/components/dashboard/OnboardingTable";
import DocsToValidateTable from "@/components/dashboard/DocsToValidateTable";
import { useDashboardContext } from "@/lib/features/dashboard/DashboardProvider";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Charts({ onOpenDossier }: { onOpenDossier?: (id: string) => void }) {
  const { isLoading } = useDashboardContext();

  if (isLoading) {
    return (
      <div className="space-y-4 lg:space-y-5 xl:space-y-6">
        <Skeleton className="h-80 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-5 xl:gap-6">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-5 xl:space-y-6">
      {/* Main chart — new dossiers + new centres over time */}
      <TrendChart />

      {/* Full-width funnel by pipeline phase (dynamic, clickable) */}
      <PhaseFunnel />

      {/* Breakdown — centres par statut + type de contrat + activités */}
      <BreakdownRow />

      {/* Operational — documents per day + reminders by due date */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5 xl:gap-6">
        <DocumentsPerDay />
        <RemindersByDueDate />
      </div>

      {/* Action — onboarding in progress + documents awaiting validation */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5 xl:gap-6">
        <OnboardingTable onOpenDossier={onOpenDossier} />
        <DocsToValidateTable />
      </div>
    </div>
  );
}
