// Folders feature — shared cache context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useFolders } from "./useFolders";

type FoldersContextValue = ReturnType<typeof useFolders>;

const FoldersContext = createContext<FoldersContextValue | undefined>(undefined);

export function FoldersProvider({ children }: { children: ReactNode }) {
  const folders = useFolders();
  return <FoldersContext.Provider value={folders}>{children}</FoldersContext.Provider>;
}

export function useFoldersContext(): FoldersContextValue {
  const ctx = useContext(FoldersContext);
  if (!ctx) {
    throw new Error("useFoldersContext must be used within a FoldersProvider");
  }
  return ctx;
}
