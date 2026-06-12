"use client";

import { useState, useEffect, useRef } from "react";
import { useCentresContext } from "@/lib/features/centres";
import { usePipelineContext } from "@/lib/features/pipeline";
import { type Center, enrichCentresWithCoords, filterCentresByPhase, centreCounts, centreEtapeCounts, ALL_PHASES } from "@/lib/features/carte";
import CarteListingView from "./carte/CarteListingView";

interface CarteViewProps {
  onOpenDossier?: (id: string) => void;
  setMobileMenuOpen?: (open: boolean) => void;
  /** Pre-select this centre on arrival (from a centre's "Voir sur la carte"). */
  focusCentreId?: string | null;
}

export default function CarteView({ onOpenDossier, setMobileMenuOpen, focusCentreId }: CarteViewProps) {
  const { centres, ensureList, getDetail, detailCache } = useCentresContext();
  const { phases, ensureLoaded: ensurePipeline } = usePipelineContext();
  // Local copy so the map can apply optimistic per-center tweaks (docs, messages).
  const [centers, setCenters] = useState<Center[]>([]);

  // Cache-guarded centres load (shared with the dashboard/dossiers).
  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);
  useEffect(() => { ensurePipeline(); }, [ensurePipeline]);

  // Resolve map pins (backend coords + geocoding fallback + de-overlap) in the carte
  // feature; the view just stores the result for optimistic per-center tweaks.
  useEffect(() => {
    let alive = true;
    enrichCentresWithCoords(centres).then((pins) => { if (alive) setCenters(pins); });
    return () => { alive = false; };
  }, [centres]);
  const [selectedFilter, setSelectedFilter] = useState<string>(ALL_PHASES);
  const [hoveredCenter, setHoveredCenter] = useState<Center | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  // Pre-select the requested centre once the pins resolve (highlight + info card).
  const focusedRef = useRef(false);
  useEffect(() => {
    if (focusedRef.current || !focusCentreId || centers.length === 0) return;
    const target = centers.find((c) => c.id === focusCentreId);
    if (target) { setHoveredCenter(target); focusedRef.current = true; }
  }, [focusCentreId, centers]);

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
  // Phase filter is keyed on the dynamic pipeline catalog (single phase reference).
  const etapeCounts = centreEtapeCounts(centers);
  const phaseTabs = [
    { value: ALL_PHASES, label: "Toutes phases", count: counts.total },
    ...[...phases].sort((a, b) => a.order - b.order).map((p) => ({ value: p.name, label: p.label, count: etapeCounts[p.name] ?? 0 })),
  ];

  // Selecting a centre (pin or card) opens its dossier hub — no separate in-page detail.
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F5F7]">
      <CarteListingView
        filteredCenters={filteredCenters}
        centers={centers}
        counts={counts}
        phaseTabs={phaseTabs}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
        hoveredCenter={hoveredCenter}
        setHoveredCenter={setHoveredCenter}
        hoveredDetail={hoveredDetail}
        selectedCenterId={focusCentreId ?? null}
        hoveredRegion={hoveredRegion}
        setHoveredRegion={setHoveredRegion}
        onOpenDossier={onOpenDossier}
        setMobileMenuOpen={setMobileMenuOpen}
      />
    </div>
  );
}
