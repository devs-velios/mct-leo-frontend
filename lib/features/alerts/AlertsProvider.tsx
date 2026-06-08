// Alerts feature — shared cache context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAlerts } from "./useAlerts";

type AlertsContextValue = ReturnType<typeof useAlerts>;

const AlertsContext = createContext<AlertsContextValue | undefined>(undefined);

export function AlertsProvider({ children }: { children: ReactNode }) {
  const alerts = useAlerts();
  return <AlertsContext.Provider value={alerts}>{children}</AlertsContext.Provider>;
}

export function useAlertsContext(): AlertsContextValue {
  const ctx = useContext(AlertsContext);
  if (!ctx) {
    throw new Error("useAlertsContext must be used within an AlertsProvider");
  }
  return ctx;
}
