"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DossierDetailsView from "@/components/DossierDetailsView";
import DossierDetailSkeleton from "@/components/dossier-details/DossierDetailSkeleton";
import { useDossiersContext } from "@/lib/features/dossiers";
import { useCentresContext } from "@/lib/features/centres";

// Map the in-page "see in X" links to their routes.
const TAB_PATHS: Record<string, string> = {
  Carte: "/dashboard/carte",
  Validations: "/dashboard/validations",
  Centres: "/dashboard/centres",
  Dossiers: "/dashboard/dossiers",
};

/**
 * Dossier detail page, keyed by the dossier id. The detail payload is centre-scoped,
 * so we resolve the dossier → its centre, then render the dossier hub focused on it.
 */
export default function DossierDetailPage() {
  return (
    <Suspense fallback={<DossierDetailSkeleton />}>
      <DossierDetailPageInner />
    </Suspense>
  );
}

function DossierDetailPageInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getDossier } = useDossiersContext();
  const { resolveLatestDossierId } = useCentresContext();
  const dossierId = String(params.id);
  // The centre switcher passes the centre id as a hint (it already knows it),
  // letting us skip the dossier→centre round trip on a centre switch.
  const centreHint = searchParams.get("centre");

  const [centreId, setCentreId] = useState<string | null>(centreHint);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (centreHint) { setCentreId(centreHint); setError(false); return; }
    let alive = true;
    setCentreId(null);
    setError(false);
    getDossier(dossierId) // cached + deduped (no double fetch)
      .then((d) => { if (alive) setCentreId(d.centre_id); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [dossierId, centreHint, getDossier]);

  // Centre switcher → open the DOSSIER of the selected centre (stay in the hub).
  // Resolution + cache-warming lives in the centres feature; the page only routes.
  // The `?centre=` hint lets the destination skip the dossier→centre round trip.
  const handleSwitchCentre = async (selectedCentreId: string) => {
    const targetDossierId = await resolveLatestDossierId(selectedCentreId);
    router.push(
      targetDossierId
        ? `/dashboard/dossiers/${targetDossierId}?centre=${selectedCentreId}`
        : `/dashboard/centres/${selectedCentreId}`
    );
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F5F5F7] gap-3">
        <p className="text-sm font-bold text-slate-500">Dossier introuvable.</p>
        <button
          onClick={() => router.push("/dashboard/dossiers")}
          className="rounded-xl bg-[#332151] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#E34F2D] transition-colors cursor-pointer"
        >
          Retour aux dossiers
        </button>
      </div>
    );
  }

  if (!centreId) {
    return <DossierDetailSkeleton />;
  }

  return (
    <DossierDetailsView
      dossierId={centreId}
      focusDossierId={dossierId}
      onClose={() => router.push("/dashboard/dossiers")}
      onNavigateToTab={(tab) => { const p = TAB_PATHS[tab]; if (p) router.push(p); }}
      onSwitch={handleSwitchCentre}
    />
  );
}
