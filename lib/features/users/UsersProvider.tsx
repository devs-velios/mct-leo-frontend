// Users feature — shared context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useUsers } from "./useUsers";

type UsersContextValue = ReturnType<typeof useUsers>;

const UsersContext = createContext<UsersContextValue | undefined>(undefined);

export function UsersProvider({ children }: { children: ReactNode }) {
  const users = useUsers();
  return <UsersContext.Provider value={users}>{children}</UsersContext.Provider>;
}

export function useUsersContext(): UsersContextValue {
  const ctx = useContext(UsersContext);
  if (!ctx) {
    throw new Error("useUsersContext must be used within a UsersProvider");
  }
  return ctx;
}
