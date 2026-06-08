// Reminders feature — shared cache context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useReminders } from "./useReminders";

type RemindersContextValue = ReturnType<typeof useReminders>;

const RemindersContext = createContext<RemindersContextValue | undefined>(undefined);

export function RemindersProvider({ children }: { children: ReactNode }) {
  const reminders = useReminders();
  return <RemindersContext.Provider value={reminders}>{children}</RemindersContext.Provider>;
}

export function useRemindersContext(): RemindersContextValue {
  const ctx = useContext(RemindersContext);
  if (!ctx) {
    throw new Error("useRemindersContext must be used within a RemindersProvider");
  }
  return ctx;
}
