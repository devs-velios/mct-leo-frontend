"use client";

import RagApprovalsView from "@/components/views/RagApprovalsView";
import { useDashboard } from "../layout";

export default function ApprobationsPage() {
  const { setMobileMenuOpen, setSelectedDossierId } = useDashboard();
  return <RagApprovalsView setMobileMenuOpen={setMobileMenuOpen} onOpenDossier={setSelectedDossierId} />;
}
