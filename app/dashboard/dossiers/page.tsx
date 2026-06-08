"use client";

import { useRouter } from "next/navigation";
import DossiersView from "@/components/DossiersView";
import { useDashboard } from "../layout";

export default function DossiersPage() {
  const { setMobileMenuOpen } = useDashboard();
  const router = useRouter();

  return (
    <DossiersView
      // The Dossiers list opens the DOSSIER detail page (file), not the centre profile.
      onOpenDossier={(dossierId) => router.push(`/dashboard/dossiers/${dossierId}`)}
      setMobileMenuOpen={setMobileMenuOpen}
    />
  );
}
