"use client";

import CarteView from "@/components/CarteView";
import { useDashboard } from "../layout";

export default function CartePage() {
  const { setSelectedDossierId, setMobileMenuOpen } = useDashboard();

  return (
    <CarteView 
      onOpenDossier={setSelectedDossierId} 
      setMobileMenuOpen={setMobileMenuOpen} 
    />
  );
}
