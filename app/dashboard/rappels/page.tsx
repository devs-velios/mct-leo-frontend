"use client";
import RemindersView from "@/components/RemindersView";
import { useDashboard } from "../layout";
export default function RappelsPage() {
  const { setMobileMenuOpen, setSelectedDossierId } = useDashboard();
  return <RemindersView setMobileMenuOpen={setMobileMenuOpen} onOpenDossier={setSelectedDossierId} />;
}
