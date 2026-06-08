// Dashboard feature — shared context provider. Wrap this around any tree
// that needs dashboard stats (e.g. AnalyticsCards + Charts) so they share
// a single fetch instead of each making their own call.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDashboard } from "./useDashboard";
import { type DashboardStats } from "./types";

interface DashboardContextValue {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { stats, isLoading, error, refresh } = useDashboard({ poll: true });

  return (
    <DashboardContext.Provider value={{ stats, isLoading, error, refresh }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return ctx;
}
