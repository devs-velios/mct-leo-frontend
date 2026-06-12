"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import ConversationsList from "@/components/conversations/ConversationsList";
import {
  useConversationsContext,
  type Conversation,
  inboxToConversation,
  filterConversations,
} from "@/lib/features/conversations";

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
  const conversations: Conversation[] = inbox.map(inboxToConversation);

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

  // Filtering rules live in the conversations feature (single source of truth).
  const filteredConversations = filterConversations(conversations, {
    search: searchQuery,
    phase: selectedPhase,
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
