"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DossierDetailsView from "@/components/DossierDetailsView";
import { fetchDossier } from "@/lib/features/dossiers";
import { useDashboard } from "../../layout";

// Map the in-page "see in X" links to their routes.
const TAB_PATHS: Record<string, string> = {
  Carte: "/dashboard/carte",
  Validations: "/dashboard/validations",
  Centres: "/dashboard/centres",
  Dossiers: "/dashboard/dossiers",
};

/**
 * Dossier detail page, keyed by the dossier id (for tracking). The detail payload is
 * centre-scoped, so we resolve the dossier → its centre, then render the dossier hub
 * focused on this specific dossier.
 */
export default function DossierDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { setSelectedDossierId } = useDashboard();
  const dossierId = String(params.id);

  const [centreId, setCentreId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setCentreId(null);
    setError(false);
    fetchDossier(dossierId)
      .then((d) => { if (alive) setCentreId(d.centre_id); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [dossierId]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F5F5F7] gap-3">
        <p className="text-sm font-bold text-slate-500">Dossier introuvable.</p>
        <button
          onClick={() => router.push("/dashboard/dossiers")}
          className="rounded-xl bg-[#2D2A56] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#EA5B2D] transition-colors cursor-pointer"
        >
          Retour aux dossiers
        </button>
      </div>
    );
  }

  if (!centreId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F5F7]">
        <div className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">
          Chargement du dossier...
        </div>
      </div>
    );
  }

  return (
    <DossierDetailsView
      dossierId={centreId}
      focusDossierId={dossierId}
      onClose={() => router.push("/dashboard/dossiers")}
      onNavigateToTab={(tab) => { const p = TAB_PATHS[tab]; if (p) router.push(p); }}
      onSwitch={setSelectedDossierId}
    />
  );
}
