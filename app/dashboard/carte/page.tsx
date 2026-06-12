"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CarteView from "@/components/CarteView";
import { useDashboard } from "../layout";

function CartePageInner() {
  const { setSelectedDossierId, setMobileMenuOpen } = useDashboard();
  // ?centre=<id> (from a centre's "Voir sur la carte") → select that pin on the map.
  const focusCentreId = useSearchParams().get("centre");

  return (
    <CarteView
      onOpenDossier={setSelectedDossierId}
      setMobileMenuOpen={setMobileMenuOpen}
      focusCentreId={focusCentreId}
    />
  );
}

export default function CartePage() {
  // useSearchParams → needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <CartePageInner />
    </Suspense>
  );
}
