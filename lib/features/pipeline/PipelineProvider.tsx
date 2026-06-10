// Pipeline catalog feature — shared context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePipeline } from "./usePipeline";

type PipelineContextValue = ReturnType<typeof usePipeline>;

const PipelineContext = createContext<PipelineContextValue | undefined>(undefined);

export function PipelineProvider({ children }: { children: ReactNode }) {
  const pipeline = usePipeline();
  return <PipelineContext.Provider value={pipeline}>{children}</PipelineContext.Provider>;
}

export function usePipelineContext(): PipelineContextValue {
  const ctx = useContext(PipelineContext);
  if (!ctx) {
    throw new Error("usePipelineContext must be used within a PipelineProvider");
  }
  return ctx;
}
