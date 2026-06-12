"use client";

import ValidationsView from "@/components/views/ValidationsView";
import { useDashboard } from "../layout";

export default function ValidationsPage() {
  const { setSelectedDossierId, setMobileMenuOpen } = useDashboard();

  return (
    <ValidationsView 
      onOpenDossier={setSelectedDossierId} 
      setMobileMenuOpen={setMobileMenuOpen} 
    />
  );
}
