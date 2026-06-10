"use client";

import { useState, useEffect } from "react";
import { useCentresContext } from "@/lib/features/centres";
import { type Center, enrichCentresWithCoords, filterCentresByPhase, centreCounts } from "@/lib/features/carte";
import CarteListingView from "./carte/CarteListingView";

interface CarteViewProps {
  onOpenDossier?: (id: string) => void;
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function CarteView({ onOpenDossier, setMobileMenuOpen }: CarteViewProps) {
  const { centres, ensureList, getDetail, detailCache } = useCentresContext();
  // Local copy so the map can apply optimistic per-center tweaks (docs, messages).
  const [centers, setCenters] = useState<Center[]>([]);

  // Cache-guarded centres load (shared with the dashboard/dossiers).
  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);

  // Resolve map pins (backend coords + geocoding fallback + de-overlap) in the carte
  // feature; the view just stores the result for optimistic per-center tweaks.
  useEffect(() => {
    let alive = true;
    enrichCentresWithCoords(centres).then((pins) => { if (alive) setCenters(pins); });
    return () => { alive = false; };
  }, [centres]);
  const [selectedFilter, setSelectedFilter] = useState<string>("Toutes phases");
  const [hoveredCenter, setHoveredCenter] = useState<Center | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Warm the FULL centre detail for the hovered pin into the shared cache (cached
  // per centre, deduped). getDetail writes the cache only — unlike ensureDetail it
  // doesn't overwrite the shared "current detail" slice on every hover.
  useEffect(() => {
    if (hoveredCenter?.id) void getDetail(hoveredCenter.id);
  }, [hoveredCenter?.id, getDetail]);
  const hoveredDetail = hoveredCenter ? detailCache[hoveredCenter.id] : undefined;

  // Phase filter + counts derive from the carte feature selectors.
  const filteredCenters = filterCentresByPhase(centers, selectedFilter);
  const counts = centreCounts(centers);

  // Selecting a centre (pin or card) opens its dossier hub — no separate in-page detail.
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F5F7]">
      <CarteListingView
        filteredCenters={filteredCenters}
        centers={centers}
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
