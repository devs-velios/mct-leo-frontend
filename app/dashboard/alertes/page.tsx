"use client";

import AlertsView from "@/components/AlertsView";
import { useDashboard } from "../layout";

export default function AlertesPage() {
  const { setMobileMenuOpen, setSelectedDossierId } = useDashboard();
  return <AlertsView setMobileMenuOpen={setMobileMenuOpen} onOpenDossier={setSelectedDossierId} />;
}
