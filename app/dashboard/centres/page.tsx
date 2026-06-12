"use client";

import CentresView from "@/components/views/CentresView";
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
