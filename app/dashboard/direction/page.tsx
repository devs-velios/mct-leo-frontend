"use client";

import { useRouter } from "next/navigation";
import DirectionView from "@/components/DirectionView";
import { useDashboard } from "../layout";

export default function DirectionPage() {
  const { setMobileMenuOpen } = useDashboard();
  const router = useRouter();

  return (
    <DirectionView
      setMobileMenuOpen={setMobileMenuOpen}
      onOpenDossier={(dossierId) => router.push(`/dashboard/dossiers/${dossierId}`)}
    />
  );
}
