"use client";

import ValidationsView from "@/components/ValidationsView";
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
