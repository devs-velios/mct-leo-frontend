// Simulate feature — shared context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSimulate } from "./useSimulate";

type SimulateContextValue = ReturnType<typeof useSimulate>;

const SimulateContext = createContext<SimulateContextValue | undefined>(undefined);

export function SimulateProvider({ children }: { children: ReactNode }) {
  const simulate = useSimulate();
  return <SimulateContext.Provider value={simulate}>{children}</SimulateContext.Provider>;
}

export function useSimulateContext(): SimulateContextValue {
  const ctx = useContext(SimulateContext);
  if (!ctx) {
    throw new Error("useSimulateContext must be used within a SimulateProvider");
  }
  return ctx;
}
