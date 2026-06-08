// Drive feature — shared cache context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDrive } from "./useDrive";

type DriveContextValue = ReturnType<typeof useDrive>;

const DriveContext = createContext<DriveContextValue | undefined>(undefined);

export function DriveProvider({ children }: { children: ReactNode }) {
  const drive = useDrive();
  return <DriveContext.Provider value={drive}>{children}</DriveContext.Provider>;
}

export function useDriveContext(): DriveContextValue {
  const ctx = useContext(DriveContext);
  if (!ctx) {
    throw new Error("useDriveContext must be used within a DriveProvider");
  }
  return ctx;
}
