// Departments feature — shared context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useDepartments } from "./useDepartments";

type DepartmentsContextValue = ReturnType<typeof useDepartments>;

const DepartmentsContext = createContext<DepartmentsContextValue | undefined>(undefined);

export function DepartmentsProvider({ children }: { children: ReactNode }) {
  const departments = useDepartments();
  return <DepartmentsContext.Provider value={departments}>{children}</DepartmentsContext.Provider>;
}

export function useDepartmentsContext(): DepartmentsContextValue {
  const ctx = useContext(DepartmentsContext);
  if (!ctx) {
    throw new Error("useDepartmentsContext must be used within a DepartmentsProvider");
  }
  return ctx;
}
