// Dossiers feature — shared cache context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDossiers } from "./useDossiers";

type DossiersContextValue = ReturnType<typeof useDossiers>;

const DossiersContext = createContext<DossiersContextValue | undefined>(undefined);

export function DossiersProvider({ children }: { children: ReactNode }) {
  const dossiers = useDossiers();
  return <DossiersContext.Provider value={dossiers}>{children}</DossiersContext.Provider>;
}

export function useDossiersContext(): DossiersContextValue {
  const ctx = useContext(DossiersContext);
  if (!ctx) {
    throw new Error("useDossiersContext must be used within a DossiersProvider");
  }
  return ctx;
}
