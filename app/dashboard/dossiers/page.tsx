"use client";

import DossiersView from "@/components/DossiersView";
import { useDashboard } from "../layout";

export default function DossiersPage() {
  const { setSelectedDossierId, setMobileMenuOpen } = useDashboard();

  return (
    <DossiersView 
      onOpenDossier={setSelectedDossierId} 
      setMobileMenuOpen={setMobileMenuOpen} 
    />
  );
}
