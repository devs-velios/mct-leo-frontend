// Centres feature — shared cache context. Mounted once (see AppProviders) so the
// centres list is fetched lazily on first use and then reused across every page
// that needs it (dashboard table, carte, dossiers, new-dossier modal …).

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCentres } from "./useCentres";

type CentresContextValue = ReturnType<typeof useCentres>;

const CentresContext = createContext<CentresContextValue | undefined>(undefined);

export function CentresProvider({ children }: { children: ReactNode }) {
  const centres = useCentres();
  return <CentresContext.Provider value={centres}>{children}</CentresContext.Provider>;
}

export function useCentresContext(): CentresContextValue {
  const ctx = useContext(CentresContext);
  if (!ctx) {
    throw new Error("useCentresContext must be used within a CentresProvider");
  }
  return ctx;
}
