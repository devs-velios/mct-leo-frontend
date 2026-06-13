// RAG topics feature — shared context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRagTopics } from "./useRagTopics";

type RagTopicsContextValue = ReturnType<typeof useRagTopics>;

const RagTopicsContext = createContext<RagTopicsContextValue | undefined>(undefined);

export function RagTopicsProvider({ children }: { children: ReactNode }) {
  const value = useRagTopics();
  return <RagTopicsContext.Provider value={value}>{children}</RagTopicsContext.Provider>;
}

export function useRagTopicsContext(): RagTopicsContextValue {
  const ctx = useContext(RagTopicsContext);
  if (!ctx) {
    throw new Error("useRagTopicsContext must be used within a RagTopicsProvider");
  }
  return ctx;
}
