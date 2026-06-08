// Assistant feature — shared context (caches the chat thread).

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAssistant } from "./useAssistant";

type AssistantContextValue = ReturnType<typeof useAssistant>;

const AssistantContext = createContext<AssistantContextValue | undefined>(undefined);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const assistant = useAssistant();
  return <AssistantContext.Provider value={assistant}>{children}</AssistantContext.Provider>;
}

export function useAssistantContext(): AssistantContextValue {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistantContext must be used within an AssistantProvider");
  }
  return ctx;
}
