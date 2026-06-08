// Documents feature — shared context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDocuments } from "./useDocuments";

type DocumentsContextValue = ReturnType<typeof useDocuments>;

const DocumentsContext = createContext<DocumentsContextValue | undefined>(undefined);

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const documents = useDocuments();
  return <DocumentsContext.Provider value={documents}>{children}</DocumentsContext.Provider>;
}

export function useDocumentsContext(): DocumentsContextValue {
  const ctx = useContext(DocumentsContext);
  if (!ctx) {
    throw new Error("useDocumentsContext must be used within a DocumentsProvider");
  }
  return ctx;
}
