"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  type Conversation,
  inboxToConversation,
} from "./conversations/conversationsData";
import ConversationsList from "./conversations/ConversationsList";
import { useConversationsContext } from "@/lib/features/conversations";

interface ConversationsViewProps {
  onOpenDossier?: (id: string) => void;
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function ConversationsView({ onOpenDossier, setMobileMenuOpen }: ConversationsViewProps) {
  // Inbox triage only — selecting a conversation opens the centre's dossier hub,
  // where the full (real) WhatsApp feed lives. No separate in-page chat screen.
  const { inbox, isLoading, ensureInbox } = useConversationsContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("Toutes phases");
  const [isPhaseDropdownOpen, setIsPhaseDropdownOpen] = useState(false);

  // Cache-guarded inbox load.
  useEffect(() => { ensureInbox(); }, [ensureInbox]);

  // Derive view conversations from the cached inbox (id = centre_id → opens the hub).
  const conversations: Conversation[] = inbox.map((i) => ({
    ...inboxToConversation(i),
    messages: [],
  }));

  // Auto close phase dropdown
  useEffect(() => {
    if (!isPhaseDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".phase-dropdown-container")) {
        setIsPhaseDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isPhaseDropdownOpen]);

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (selectedPhase !== "Toutes phases") {
      if (c.phase !== selectedPhase) return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(query);
      const matchSubtitle = c.subtitle.toLowerCase().includes(query);
      const matchId = c.id.toLowerCase().includes(query);
      if (!matchTitle && !matchSubtitle && !matchId) return false;
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F5F7]">
      <AnimatePresence mode="wait">
        <ConversationsList
          conversations={filteredConversations}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedPhase={selectedPhase}
          setSelectedPhase={setSelectedPhase}
          isPhaseDropdownOpen={isPhaseDropdownOpen}
          setIsPhaseDropdownOpen={setIsPhaseDropdownOpen}
          onSelectConversation={(id) => onOpenDossier?.(id)}
          onOpenDossier={onOpenDossier}
          setMobileMenuOpen={setMobileMenuOpen}
          loading={isLoading}
        />
      </AnimatePresence>
    </div>
  );
}
