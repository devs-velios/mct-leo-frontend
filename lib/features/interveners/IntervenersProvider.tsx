// Interveners feature — shared context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useInterveners } from "./useInterveners";

type IntervenersContextValue = ReturnType<typeof useInterveners>;

const IntervenersContext = createContext<IntervenersContextValue | undefined>(undefined);

export function IntervenersProvider({ children }: { children: ReactNode }) {
  const interveners = useInterveners();
  return <IntervenersContext.Provider value={interveners}>{children}</IntervenersContext.Provider>;
}

export function useIntervenersContext(): IntervenersContextValue {
  const ctx = useContext(IntervenersContext);
  if (!ctx) {
    throw new Error("useIntervenersContext must be used within an IntervenersProvider");
  }
  return ctx;
}
