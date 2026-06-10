// RAG feature — shared cache context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRag } from "./useRag";

type RagContextValue = ReturnType<typeof useRag>;

const RagContext = createContext<RagContextValue | undefined>(undefined);

export function RagProvider({ children }: { children: ReactNode }) {
  const rag = useRag();
  return <RagContext.Provider value={rag}>{children}</RagContext.Provider>;
}

export function useRagContext(): RagContextValue {
  const ctx = useContext(RagContext);
  if (!ctx) {
    throw new Error("useRagContext must be used within a RagProvider");
  }
  return ctx;
}
