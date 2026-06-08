// Pieces feature — shared cache context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePieces } from "./usePieces";

type PiecesContextValue = ReturnType<typeof usePieces>;

const PiecesContext = createContext<PiecesContextValue | undefined>(undefined);

export function PiecesProvider({ children }: { children: ReactNode }) {
  const pieces = usePieces();
  return <PiecesContext.Provider value={pieces}>{children}</PiecesContext.Provider>;
}

export function usePiecesContext(): PiecesContextValue {
  const ctx = useContext(PiecesContext);
  if (!ctx) {
    throw new Error("usePiecesContext must be used within a PiecesProvider");
  }
  return ctx;
}
