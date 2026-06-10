"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronRight, Compass, Menu, Plus, Minus, RotateCcw, CheckCircle, Map, Layers, PenTool, UserCheck, FolderPlus, Activity, Phone, Mail } from "lucide-react";
import { REGIONS } from "./carteData";
import { ResponsiveTabs } from "@/components/ui/responsive-tabs";
import { na } from "@/lib/utils";
import { type CentreDetail } from "@/lib/features/centres";
import { type Center, hoveredCentreInfo, carteStats, centersInRegion } from "@/lib/features/carte";

interface Counts {
  total: number;
  signature: number;
  onboarding: number;
  depot: number;
  ouvert: number;
  suivi: number;
}

interface CarteListingViewProps {
  filteredCenters: Center[];
  centers: Center[];
  counts: Counts;
  selectedFilter: string;
  setSelectedFilter: (value: string) => void;
  hoveredCenter: Center | null;
  setHoveredCenter: (center: Center | null) => void;
  hoveredDetail?: CentreDetail;
  selectedCenterId: string | null;
  hoveredRegion: string | null;
  setHoveredRegion: (id: string | null) => void;
  onOpenDossier?: (id: string) => void;
  setMobileMenuOpen?: (open: boolean) => void;
}

interface Cluster {
  id: string;
  centroid: { x: number; y: number };
  centers: Center[];
}

// Group points that are closer than a threshold distance
const FILTER_TABS = [
  {
    key: "Toutes phases",
    label: "Toutes phases",
    countKey: "total" as const,
    icon: Layers,
    activeColor: "bg-gradient-to-r from-[#332151] to-[#423E82] text-white shadow-[0_8px_20px_-4px_rgba(45,42,86,0.3)]",
    textColor: "text-[#332151]",
    dotColor: "bg-[#E34F2D]"
  },
  {
    key: "Signature",
    label: "Signature",
    countKey: "signature" as const,
    icon: PenTool,
    activeColor: "bg-gradient-to-r from-[#332151] to-[#423E82] text-white shadow-[0_8px_20px_-4px_rgba(45,42,86,0.3)]",
    textColor: "text-[#332151]",
    dotColor: "bg-[#E34F2D]"
  },
  {
    key: "Onboarding",
    label: "Onboarding",
    countKey: "onboarding" as const,
    icon: UserCheck,
    activeColor: "bg-gradient-to-r from-[#E34F2D] to-[#EA5835] text-white shadow-[0_8px_20px_-4px_rgba(234,91,45,0.3)]",
    textColor: "text-[#E34F2D]",
    dotColor: "bg-[#E34F2D]"
  },
  {
    key: "Dépôt agrément",
    label: "Dépôt agrément",
    countKey: "depot" as const,
    icon: FolderPlus,
    activeColor: "bg-gradient-to-r from-[#332151] to-[#423E82] text-white shadow-[0_8px_20px_-4px_rgba(45,42,86,0.3)]",
    textColor: "text-[#332151]",
    dotColor: "bg-[#E34F2D]"
  },
  {
    key: "Ouvert",
    label: "Ouvert",
    countKey: "ouvert" as const,
    icon: CheckCircle,
    activeColor: "bg-gradient-to-r from-[#332151] to-[#423E82] text-white shadow-[0_8px_20px_-4px_rgba(45,42,86,0.3)]",
    textColor: "text-[#332151]",
    dotColor: "bg-[#E34F2D]"
  },
  {
    key: "Suivi",
    label: "Suivi",
    countKey: "suivi" as const,
    icon: Activity,
    activeColor: "bg-gradient-to-r from-[#332151] to-[#423E82] text-white shadow-[0_8px_20px_-4px_rgba(45,42,86,0.3)]",
    textColor: "text-[#332151]",
    dotColor: "bg-[#E34F2D]"
  }
];

export default function CarteListingView({
  filteredCenters,
  centers,
  counts,
  selectedFilter,
  setSelectedFilter,
  hoveredCenter,
  setHoveredCenter,
  hoveredDetail,
  selectedCenterId,
  hoveredRegion,
  setHoveredRegion,
  onOpenDossier,
  setMobileMenuOpen
}: CarteListingViewProps) {
  // Important real info for the hovered/selected pin (normalized in the carte feature).
  const hoveredInfo = useMemo(() => hoveredCentreInfo(hoveredDetail), [hoveredDetail]);
  // Zoom & Pan State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Native wheel listener to avoid passive listener warning
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const scaleFactor = 1.1;
      setZoom(prev => {
        let next = prev;
        if (e.deltaY < 0) {
          next = Math.min(prev * scaleFactor, 6);
        } else {
          next = Math.max(prev / scaleFactor, 1);
        }
        return next;
      });
    };

    svg.addEventListener("wheel", handleWheelNative, { passive: false });
    return () => {
      svg.removeEventListener("wheel", handleWheelNative);
    };
  }, []);

  // Pan interaction handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const target = e.target as SVGElement;
    if (target.tagName === "circle" || target.tagName === "text" || target.closest(".map-control-btn")) return;

    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.25, 6));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.25, 1));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // One point = one center — clustering disabled (each centre renders its own marker).
  const clusteredItems = useMemo<(Center | Cluster)[]>(() => filteredCenters, [filteredCenters]);

  // Handle cluster click
  const handleClusterClick = (cluster: Cluster) => {
    const nextZoom = Math.min(zoom * 1.5, 6);
    setZoom(nextZoom);
    setPan({
      x: 300 - cluster.centroid.x * nextZoom,
      y: 290 - cluster.centroid.y * nextZoom
    });
  };

  // Coverage stats + hovered-region count derive from the carte feature selectors.
  const stats = useMemo(() => carteStats(filteredCenters), [filteredCenters]);
  const centersInHoveredRegion = useMemo(
    () => centersInRegion(filteredCenters, hoveredRegion),
    [hoveredRegion, filteredCenters],
  );

  return (
    <motion.div
      key="listing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col h-full overflow-hidden"
    >
      {/* Topbar */}
      <header className="px-4 sm:px-6 py-4 bg-white border-b border-slate-100 shrink-0 relative z-10 w-full min-w-0">
        {setMobileMenuOpen && (
          <div className="flex items-center justify-between md:hidden mb-2 w-full">
            <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold font-serif-mct text-[#332151] tracking-tight">
              Carte interactive du réseau
            </h2>
            <p className="text-xs text-[#5A5A7A] mt-0.5">
              Visualisez et pilotez les {counts.total} centres du pipeline national.
            </p>
          </div>
        </div>
      </header>

      {/* Statistics Header Cards (minimal) */}
      <div className="p-4 sm:p-6 pb-2 shrink-0">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Total localisations", value: String(counts.total), icon: Map },
            { title: "Sites actifs", value: String(stats.activeSites), icon: CheckCircle },
            { title: "Régions couvertes", value: String(stats.coverageRegions), icon: Compass },
          ].map(({ title, value, icon: Icon }) => (
            <div key={title} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">{title}</p>
                <h3 className="mt-1 text-2xl font-bold text-[#332151]">{value}</h3>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#332151]">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tab bar */}
      <div className="px-4 sm:px-6 pb-2 shrink-0">
        <div className="max-w-[1400px] mx-auto">
          <ResponsiveTabs
            value={selectedFilter}
            onValueChange={setSelectedFilter}
            options={FILTER_TABS.map((tab) => ({
              value: tab.key,
              label: tab.label,
              icon: tab.icon,
              count: counts[tab.countKey],
            }))}
          />
        </div>
      </div>

      {/* Map Grid container */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto w-full min-w-0 pb-20">
        <div className="max-w-[1400px] mx-auto h-auto lg:h-[580px] xl:h-[680px] grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          {/* Map Section */}
          <div className="lg:col-span-3 min-h-[460px] sm:min-h-[580px] lg:min-h-0 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-4 flex flex-col items-center justify-center relative overflow-hidden select-none">
            
            {/* Inline keyframe animation styles */}
            <style jsx global>{`
              @keyframes pulseRing {
                0% { transform: scale(0.95); opacity: 0.8; }
                50% { transform: scale(1.35); opacity: 0.35; }
                100% { transform: scale(1.7); opacity: 0; }
              }
              .map-pulse {
                transform-origin: center;
                animation: pulseRing 2s infinite ease-out;
              }
            `}</style>

            {/* Legend / Info layer overlay */}
            <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-100 text-[10px] text-slate-600 font-semibold shadow-md">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E34F2D] shadow-sm"></span>
                <span className="flex items-center gap-1">Centres <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[9px] font-black text-[#332151]">{counts.total}</span></span>
              </div>
            </div>

            {/* Region HUD Overlay */}
            {hoveredRegion && (
              <div className="absolute bottom-4 left-4 z-10 bg-[#332151] text-white px-3 py-2 rounded-2xl shadow-lg border border-white/10 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#E34F2D]">
                  {REGIONS.find(r => r.id === hoveredRegion)?.name}
                </span>
                <span className="text-[9px] font-bold text-white/80">
                  {centersInHoveredRegion} centre{centersInHoveredRegion > 1 ? "s" : ""} dans la zone
                </span>
              </div>
            )}

            {/* Zoom / Navigation Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
              {[
                { icon: Plus, onClick: handleZoomIn, label: "Zoomer" },
                { icon: Minus, onClick: handleZoomOut, label: "Dézoomer" },
                { icon: RotateCcw, onClick: handleReset, label: "Réinitialiser" }
              ].map((ctrl, i) => (
                <button
                  key={i}
                  onClick={ctrl.onClick}
                  title={ctrl.label}
                  className="map-control-btn w-9 h-9 rounded-xl bg-white hover:bg-slate-50 border border-slate-100 text-[#332151] flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                >
                  <ctrl.icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            {/* SVG France Map Container */}
            <svg
              ref={svgRef}
              viewBox="15 -1 598 586"
              className={`w-full h-full max-h-[94%] select-none transition-all duration-75 cursor-${isDragging ? "grabbing" : "grab"}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
            >
              {/* Inner Transform Group */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} className="transition-transform duration-100 ease-out">
                {/* Regions paths */}
                <g>
                  {REGIONS.map((region) => {
                    const isRegionHovered = hoveredRegion === region.id;
                    return (
                      <path
                        key={region.id}
                        d={region.path}
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          fill: isRegionHovered ? "rgba(234, 91, 45, 0.08)" : "rgba(45, 42, 86, 0.03)",
                          stroke: isRegionHovered ? "#E34F2D" : "#E2E8F0",
                          strokeWidth: isRegionHovered ? 1.5 : 1
                        }}
                        onMouseEnter={() => setHoveredRegion(region.id)}
                        onMouseLeave={() => setHoveredRegion(null)}
                      />
                    );
                  })}
                </g>

                {/* Render Clustered Markers */}
                <g>
                  {clusteredItems.map((item) => {
                    const isCluster = "centers" in item;
                    
                    if (isCluster) {
                      const cluster = item as Cluster;
                      return (
                        <g
                          key={cluster.id}
                          className="cursor-pointer"
                          onClick={() => handleClusterClick(cluster)}
                          onMouseEnter={() => setHoveredCenter(cluster.centers[0])}
                        >
                          <circle
                            cx={cluster.centroid.x}
                            cy={cluster.centroid.y}
                            r={14}
                            className="fill-[#E34F2D] opacity-20 animate-ping"
                            style={{ transformOrigin: `${cluster.centroid.x}px ${cluster.centroid.y}px` }}
                          />
                          <circle
                            cx={cluster.centroid.x}
                            cy={cluster.centroid.y}
                            r={12}
                            className="fill-[#E34F2D] stroke-white stroke-2 shadow-md hover:scale-110 transition-transform duration-200"
                          />
                          <text
                            x={cluster.centroid.x}
                            y={cluster.centroid.y}
                            textAnchor="middle"
                            dy=".3em"
                            className="fill-white text-[9px] font-black pointer-events-none"
                          >
                            {cluster.centers.length}
                          </text>
                        </g>
                      );
                    }

                    // Individual Center Marker
                    const center = item as Center;
                    const isHovered = hoveredCenter?.id === center.id;
                    const isSelected = selectedCenterId === center.id;
                    const isActive = center.phase === "Onboarding" || center.phase === "Ouvert";
                    const markerColor = "#E34F2D"; // single brand colour for all dots

                    // Radius: gentle growth on hover/selection (no big jump).
                    const radius = isHovered || isSelected ? 6 : (center.joursInactif === 0 ? 5.5 : 4.5);

                    return (
                      <g key={center.id} className="cursor-pointer">
                        {/* Subtle halo for active onboarding sites (reduced glow) */}
                        {isActive && (
                          <circle
                            cx={center.x}
                            cy={center.y}
                            r={radius * 1.5}
                            fill={markerColor}
                            className="opacity-15 pointer-events-none"
                            style={{ transformOrigin: `${center.x}px ${center.y}px` }}
                          />
                        )}
                        {/* Outer Glow on hover */}
                        {(isHovered || isSelected) && (
                          <circle
                            cx={center.x}
                            cy={center.y}
                            r={radius * 1.8}
                            fill={markerColor}
                            opacity={0.25}
                            className="transition-all duration-200"
                          />
                        )}
                        {/* Main Pin Circle */}
                        <circle
                          cx={center.x}
                          cy={center.y}
                          r={radius}
                          fill={markerColor}
                          stroke="#FFFFFF"
                          strokeWidth={1.5}
                          className="transition-all duration-150"
                          onMouseEnter={() => setHoveredCenter(center)}
                          onClick={() => onOpenDossier?.(center.id)}
                        />
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>
          </div>

          {/* Sidebar details panel */}
          <div className="lg:col-span-1 flex flex-col">
            <AnimatePresence mode="wait">
              {hoveredCenter ? (
                <motion.div
                  key="hover-card"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-5 flex flex-col justify-between transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-[9px] font-bold text-[#5A5A7A] uppercase">
                        {hoveredCenter.code ?? hoveredCenter.id}
                      </span>
                      <span className="text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E34F2D]/10 text-[#E34F2D] border border-[#E34F2D]/20 leading-none">
                        {hoveredCenter.phase}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-[#332151] leading-snug mb-1">
                      {na(hoveredCenter.enseigne)}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 mb-5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[#E34F2D]" />
                      {na(hoveredCenter.ville)}
                    </p>

                    <div className="space-y-3 border-t border-slate-50 pt-4 text-[10px] font-semibold text-slate-500">
                      {/* Contrat + activités */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-[#332151]/5 text-[#332151] font-extrabold text-[9px] uppercase tracking-wider">
                          {hoveredInfo?.type ?? "—"}
                        </span>
                        {(hoveredInfo?.activites ?? []).map((a) => (
                          <span key={a} className="px-2 py-0.5 rounded-md bg-[#E34F2D]/10 text-[#E34F2D] font-extrabold text-[9px]">{a}</span>
                        ))}
                      </div>

                      {/* Étape */}
                      <div>
                        <span className="block text-[8px] font-extrabold uppercase tracking-wider text-[#5A5A7A] mb-0.5">Étape</span>
                        <span className="text-slate-800 font-bold">{na(hoveredInfo?.etape || hoveredCenter.phase)}</span>
                      </div>

                      {/* Adresse */}
                      <div>
                        <span className="block text-[8px] font-extrabold uppercase tracking-wider text-[#5A5A7A] mb-0.5">Adresse</span>
                        <span className="text-slate-800 font-bold">{na(hoveredInfo?.adresse || hoveredCenter.ville)}</span>
                      </div>

                      {/* Contacts */}
                      <div>
                        <span className="block text-[8px] font-extrabold uppercase tracking-wider text-[#5A5A7A] mb-1">Contact</span>
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{na(hoveredInfo?.phone)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 mt-1 min-w-0">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{na(hoveredInfo?.email)}</span>
                        </div>
                      </div>

                      {/* Pièces + complétude */}
                      <div>
                        <span className="block text-[8px] font-extrabold uppercase tracking-wider text-[#5A5A7A] mb-1">Pièces du dossier</span>
                        <div className="flex items-center justify-between text-[9px] font-bold mb-1">
                          <span className="text-emerald-600">{hoveredInfo?.present ?? 0} reçues</span>
                          <span className="text-slate-400">{hoveredInfo?.missing ?? 0} manquantes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${hoveredInfo?.completeness ?? hoveredCenter.completude}%` }}></div>
                          </div>
                          <span className="text-slate-800 font-bold text-[9px]">{hoveredInfo?.completeness ?? hoveredCenter.completude}%</span>
                        </div>
                      </div>

                      {/* Alertes / rappels */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${(hoveredInfo?.openAlerts ?? 0) > 0 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-400"}`}>
                          {hoveredInfo?.openAlerts ?? 0} alerte{(hoveredInfo?.openAlerts ?? 0) > 1 ? "s" : ""}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${(hoveredInfo?.pendingReminders ?? 0) > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-400"}`}>
                          {hoveredInfo?.pendingReminders ?? 0} rappel{(hoveredInfo?.pendingReminders ?? 0) > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenDossier?.(hoveredCenter.id)}
                    className="w-full mt-6 py-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-[#E34F2D] hover:text-white transition-all text-[10px] font-extrabold text-[#E34F2D] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  >
                    <span>Ouvrir le dossier complet</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 flex flex-col items-center justify-center text-center"
                >
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4 border border-slate-100/50 shadow-inner">
                    <MapPin className="h-6 w-6 text-[#332151] opacity-75" />
                  </div>
                  <h4 className="text-xs font-bold text-[#332151] mb-1">
                    Survolez un centre
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-400 max-w-[150px] leading-relaxed">
                    Survolez un point sur la carte pour voir les détails du dossier.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Onboarding centres — full list below the map */}
        <div className="max-w-[1400px] mx-auto mt-6">
          {(() => {
            const onboardingCenters = centers.filter((c) => c.phase === "Onboarding");
            return (
              <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#E34F2D]">Onboarding</p>
                    <h3 className="flex items-center gap-2 font-serif-mct text-base font-bold text-[#332151]">
                      Centres en onboarding
                      <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-black text-[#332151]">{onboardingCenters.length}</span>
                    </h3>
                  </div>
                </div>
                {onboardingCenters.length === 0 ? (
                  <p className="text-sm font-medium text-[#5A5A7A]">Aucun centre en onboarding.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {onboardingCenters.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onOpenDossier?.(c.id)}
                        className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-left transition-colors hover:border-[#E34F2D]/30 hover:bg-white"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#332151] group-hover:text-[#E34F2D]">
                            {c.enseigne || c.code || c.id}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#5A5A7A]">
                            {c.code && <span className="font-mono">{c.code}</span>}
                            {c.code && c.ville && <span className="text-slate-300">·</span>}
                            {c.ville && (
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin className="h-3 w-3 opacity-60" /> {c.ville}
                              </span>
                            )}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#E34F2D]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
}
