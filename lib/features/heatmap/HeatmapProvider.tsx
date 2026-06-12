// Direction heat-map feature — shared context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useHeatmap } from "./useHeatmap";

type HeatmapContextValue = ReturnType<typeof useHeatmap>;

const HeatmapContext = createContext<HeatmapContextValue | undefined>(undefined);

export function HeatmapProvider({ children }: { children: ReactNode }) {
  const heatmap = useHeatmap();
  return <HeatmapContext.Provider value={heatmap}>{children}</HeatmapContext.Provider>;
}

export function useHeatmapContext(): HeatmapContextValue {
  const ctx = useContext(HeatmapContext);
  if (!ctx) {
    throw new Error("useHeatmapContext must be used within a HeatmapProvider");
  }
  return ctx;
}
