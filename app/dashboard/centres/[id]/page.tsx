"use client";

import { useParams, useRouter } from "next/navigation";
import CentreDetailView from "@/components/centres/CentreDetailView";

/**
 * Center detail page — a dedicated, minimal view of a single centre, keyed by
 * the centre id. Renders all centre information (identity, address, dossiers,
 * pièces) without the heavier dossier hub.
 */
export default function CentreDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const centreId = String(params.id);

  return (
    <CentreDetailView
      centreId={centreId}
      onBack={() => router.push("/dashboard/centres")}
      onOpenDossier={(dossierId) => router.push(`/dashboard/dossiers/${dossierId}`)}
      onViewOnMap={() => router.push(`/dashboard/carte?centre=${centreId}`)}
    />
  );
}
