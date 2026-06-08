// Conversations feature — shared cache context.

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useConversations } from "./useConversations";

type ConversationsContextValue = ReturnType<typeof useConversations>;

const ConversationsContext = createContext<ConversationsContextValue | undefined>(undefined);

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const conversations = useConversations();
  return <ConversationsContext.Provider value={conversations}>{children}</ConversationsContext.Provider>;
}

export function useConversationsContext(): ConversationsContextValue {
  const ctx = useContext(ConversationsContext);
  if (!ctx) {
    throw new Error("useConversationsContext must be used within a ConversationsProvider");
  }
  return ctx;
}
