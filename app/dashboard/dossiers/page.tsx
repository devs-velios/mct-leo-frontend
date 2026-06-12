"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import DossiersView from "@/components/DossiersView";
import { useDashboard } from "../layout";

export default function DossiersPage() {
  const { setMobileMenuOpen } = useDashboard();
  const router = useRouter();

  return (
    // DossiersView reads ?statut / ?etape via useSearchParams → needs a Suspense boundary.
    <Suspense fallback={null}>
      <DossiersView
        // Clicking a row opens the CENTRE profile (not a dossier view).
        onOpenCentre={(centreId) => router.push(`/dashboard/centres/${centreId}`)}
        setMobileMenuOpen={setMobileMenuOpen}
      />
    </Suspense>
  );
}
