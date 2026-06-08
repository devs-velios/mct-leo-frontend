"use client";

import CentresView from "@/components/CentresView";
import { useDashboard } from "../layout";

export default function CentresPage() {
  const { setSelectedDossierId, setMobileMenuOpen } = useDashboard();

  return (
    <CentresView
      onOpenDossier={setSelectedDossierId}
      setMobileMenuOpen={setMobileMenuOpen}
    />
  );
}
