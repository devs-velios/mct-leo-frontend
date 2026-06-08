"use client";

import ConversationsView from "@/components/ConversationsView";
import { useDashboard } from "../layout";

export default function ConversationsPage() {
  const { setSelectedDossierId, setMobileMenuOpen } = useDashboard();

  return (
    <ConversationsView 
      onOpenDossier={setSelectedDossierId} 
      setMobileMenuOpen={setMobileMenuOpen} 
    />
  );
}
