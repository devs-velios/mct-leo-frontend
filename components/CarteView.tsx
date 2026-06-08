"use client";

import { useState, useEffect } from "react";
import { type Center, centresToCarte, type CentreApiGeo } from "./carte/carteData";
import { useCentresContext } from "@/lib/features/centres";
import { geocode } from "@/lib/features/carte/geocode";
import CarteListingView from "./carte/CarteListingView";

interface CarteViewProps {
  onOpenDossier?: (id: string) => void;
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function CarteView({ onOpenDossier, setMobileMenuOpen }: CarteViewProps) {
  const { centres, ensureList, ensureDetail, detailCache } = useCentresContext();
  // Local copy so the map can apply optimistic per-center tweaks (docs, messages).
  const [centers, setCenters] = useState<Center[]>([]);

  // Cache-guarded centres load (shared with the dashboard/dossiers).
  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);

  // The backend now geocodes centres (lat/long). Use those directly; only fall back
  // to client-side geocoding for any centre not yet geocoded. Centres landing on the
  // exact same point get a small spiral offset so their pins don't overlap.
  useEffect(() => {
    let alive = true;
    (async () => {
      // Geocode (fallback) only the cities of centres that lack backend coordinates.
      const missingVilles = [
        ...new Set(
          centres
            .filter((c) => c.latitude == null || c.longitude == null)
            .map((c) => (c.ville ?? "").trim())
            .filter(Boolean),
        ),
      ];
      const fallback = new Map<string, { lat: number; lng: number } | null>();
      await Promise.all(missingVilles.map(async (v) => { fallback.set(v.toLowerCase(), await geocode(v)); }));
      if (!alive) return;

      const perPoint = new Map<string, number>();
      const enriched = centres.map((c) => {
        let lat = c.latitude ?? null;
        let lng = c.longitude ?? null;
        if (lat == null || lng == null) {
          const g = c.ville ? fallback.get(c.ville.trim().toLowerCase()) : null;
          if (g) { lat = g.lat; lng = g.lng; }
        }
        if (lat == null || lng == null) return { ...c, latitude: null, longitude: null };
        // Spread pins that share an identical point.
        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        const n = perPoint.get(key) ?? 0;
        perPoint.set(key, n + 1);
        const angle = n * 2.399963; // golden angle
        const r = n === 0 ? 0 : 0.012 * Math.sqrt(n); // ~1 km steps
        return { ...c, latitude: lat + r * Math.cos(angle), longitude: lng + r * Math.sin(angle) };
      });
      setCenters(centresToCarte(enriched as unknown as CentreApiGeo[]));
    })();
    return () => { alive = false; };
  }, [centres]);
  const [selectedFilter, setSelectedFilter] = useState<string>("Toutes phases");
  const [hoveredCenter, setHoveredCenter] = useState<Center | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Fetch the FULL centre detail for the hovered pin via the shared context cache
  // (cached per centre, deduped, and reused by the centre detail page).
  useEffect(() => {
    if (hoveredCenter?.id) ensureDetail(hoveredCenter.id);
  }, [hoveredCenter?.id, ensureDetail]);
  const hoveredDetail = hoveredCenter ? detailCache[hoveredCenter.id] : undefined;

  // Filter centers based on tab selection
  const filteredCenters = centers.filter((center) => {
    if (selectedFilter === "Toutes phases") return true;
    if (selectedFilter === "Signature") return center.phase === "Signature";
    if (selectedFilter === "Onboarding") return center.phase === "Onboarding";
    if (selectedFilter === "Dépôt agrément") return center.phase === "Dépôt";
    if (selectedFilter === "Ouvert") return center.phase === "Ouvert";
    if (selectedFilter === "Suivi") return center.phase === "Suivi";
    return true;
  });

  const counts = {
    total: centers.length,
    signature: centers.filter(c => c.phase === "Signature").length,
    onboarding: centers.filter(c => c.phase === "Onboarding").length,
    depot: centers.filter(c => c.phase === "Dépôt").length,
    ouvert: centers.filter(c => c.phase === "Ouvert").length,
    suivi: centers.filter(c => c.phase === "Suivi").length
  };

  // Selecting a centre (pin or card) opens its dossier hub — no separate in-page detail.
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F5F7]">
      <CarteListingView
        filteredCenters={filteredCenters}
        counts={counts}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
        hoveredCenter={hoveredCenter}
        setHoveredCenter={setHoveredCenter}
        hoveredDetail={hoveredDetail}
        selectedCenterId={null}
        hoveredRegion={hoveredRegion}
        setHoveredRegion={setHoveredRegion}
        onOpenDossier={onOpenDossier}
        setMobileMenuOpen={setMobileMenuOpen}
      />
    </div>
  );
}
