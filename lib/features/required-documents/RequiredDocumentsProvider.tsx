// Required documents feature — shared context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useRequiredDocuments } from "./useRequiredDocuments";

type RequiredDocumentsContextValue = ReturnType<typeof useRequiredDocuments>;

const RequiredDocumentsContext = createContext<RequiredDocumentsContextValue | undefined>(undefined);

export function RequiredDocumentsProvider({ children }: { children: ReactNode }) {
  const value = useRequiredDocuments();
  return <RequiredDocumentsContext.Provider value={value}>{children}</RequiredDocumentsContext.Provider>;
}

export function useRequiredDocumentsContext(): RequiredDocumentsContextValue {
  const ctx = useContext(RequiredDocumentsContext);
  if (!ctx) {
    throw new Error("useRequiredDocumentsContext must be used within a RequiredDocumentsProvider");
  }
  return ctx;
}
