"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  Clock,
  AlertTriangle,
  Building,
  Search,
  ChevronDown,
  List,
  Kanban as KanbanIcon,
  Menu,
  X
} from "lucide-react";
import { type Dossier, dossierToRow } from "./dossiers/dossiersData";
import DossiersTable from "./dossiers/DossiersTable";
import DossiersKanban from "./dossiers/DossiersKanban";
import { useDossiersContext } from "@/lib/features/dossiers";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DossiersViewProps {
  onOpenDossier?: (id: string) => void;
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function DossiersView({ onOpenDossier, setMobileMenuOpen }: DossiersViewProps) {
  const { dossiers, isLoading, ensureLoaded, advance } = useDossiersContext();
  const [dossiersList, setDossiersList] = useState<Dossier[]>([]);
  const [selectedSubFilter, setSelectedSubFilter] = useState<"tout" | "relancer" | "bloques" | "ouverts">("tout");

  // Cache-guarded load via the shared dossiers context; map backend rows → view shape.
  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
  useEffect(() => { setDossiersList(dossiers.map(dossierToRow)); }, [dossiers]);

  // Move a dossier one stage (macro auto-updates); context refreshes the cached list.
  const handleAdvance = async (dossierId: string, direction: "next" | "back") => {
    try {
      await advance(dossierId, { direction });
    } catch {
      /* 422 at pipeline ends / illegal jump */
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("Toutes enseignes");
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"tableau" | "kanban">("tableau");

  // Drag and Drop local states
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<string | null>(null);

  // Table pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Auto close dropdown
  useEffect(() => {
    if (!isNetworkDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".network-dropdown-container")) {
        setIsNetworkDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isNetworkDropdownOpen]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubFilter, searchQuery, selectedNetwork]);

  // Filter dossiers logic
  const filteredDossiers = dossiersList.filter((item) => {
    // 1. Enseigne Network Filter
    if (selectedNetwork !== "Toutes enseignes") {
      if (item.enseigne !== selectedNetwork) return false;
    }

    // 2. Search Query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchId = item.id.toLowerCase().includes(query);
      const matchCentre = item.centre.toLowerCase().includes(query);
      const matchGerant = item.gerant.toLowerCase().includes(query);
      const matchVille = item.ville.toLowerCase().includes(query);
      if (!matchId && !matchCentre && !matchGerant && !matchVille) return false;
    }

    // 3. Sub-Filters tabs
    if (selectedSubFilter === "relancer") {
      if (item.joursInactif < 5 || item.phase === "Ouvert" || item.phase === "Suivi qualité") return false;
    } else if (selectedSubFilter === "bloques") {
      if (item.joursInactif < 14) return false;
    } else if (selectedSubFilter === "ouverts") {
      if (item.phase !== "Ouvert" && item.phase !== "Suivi qualité") return false;
    }

    return true;
  });

  // Calculate dynamic stats based on FULL dossiers list
  const statTotal = dossiersList.length;
  const statRelancer = dossiersList.filter(d => d.joursInactif >= 5 && d.phase !== "Ouvert" && d.phase !== "Suivi qualité").length;
  const statBloques = dossiersList.filter(d => d.joursInactif >= 14).length;
  const statOuverts = dossiersList.filter(d => d.phase === "Ouvert" || d.phase === "Suivi qualité").length;

  // Pagination calculation
  const totalItems = filteredDossiers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedDossiers = filteredDossiers.slice(startIndex, endIndex);

  // Drag and drop HTML5 handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, colName: string) => {
    e.preventDefault();
    setActiveDropCol(colName);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetCol: Dossier["phase"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (id) {
      setDossiersList((prevList) =>
        prevList.map((dossier) =>
          dossier.id === id ? { ...dossier, phase: targetCol } : dossier
        )
      );
    }
    setDraggedId(null);
    setActiveDropCol(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F5F7]">
      {/* 1. TOP BAR ACCORDING TO THE SPECIFICATION */}
      <header className="px-4 sm:px-6 py-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 bg-white border-b border-slate-100 relative z-10 shrink-0 w-full min-w-0">
        <div className="w-full xl:w-auto">
          {setMobileMenuOpen && (
            <div className="flex items-center justify-between md:hidden mb-2 w-full">
              <span className="font-serif-mct text-lg font-bold text-[#2D2A56]">MCT Léo</span>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          )}
          <h2 className="text-2xl font-bold font-serif-mct text-[#2D2A56] tracking-tight">
            Tous les dossiers
          </h2>
          <p className="text-xs text-[#5A5A7A] mt-0.5">
            Vue d'ensemble du pipeline d'onboarding et de l'agrément.
          </p>
        </div>
      </header>

      {/* Main workspace container */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 w-full min-w-0 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* 2. KPI CARDS (minimal) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {[
              { label: "Total", value: statTotal, hint: "dossiers actifs", Icon: Folder, tone: "bg-slate-100 text-[#2D2A56]" },
              { label: "À relancer", value: statRelancer, hint: "≥ 5j sans activité", Icon: Clock, tone: "bg-[#EA5B2D]/10 text-[#EA5B2D]" },
              { label: "Bloqués", value: statBloques, hint: "agrément ou ≥ 14j", Icon: AlertTriangle, tone: "bg-rose-50 text-rose-600" },
              { label: "Ouverts", value: statOuverts, hint: "centres ouverts", Icon: Building, tone: "bg-emerald-50 text-emerald-600" },
            ].map(({ label, value, hint, Icon, tone }) => (
              <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">{label}</p>
                  <h3 className="mt-1 text-2xl font-bold text-[#2D2A56]">{value}</h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            ))}
          </div>

          {/* 3. FILTERS ROW */}
          <div className="relative z-20 bg-white p-5 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgba(45,42,86,0.015)] flex flex-col xl:flex-row xl:items-center justify-between gap-5">

            {/* Left filter status tabs */}
            <Tabs value={selectedSubFilter} onValueChange={(v) => setSelectedSubFilter(v as typeof selectedSubFilter)}>
              <TabsList className="flex-wrap">
                {[
                  { key: "tout", label: "Tous", count: statTotal },
                  { key: "relancer", label: "À relancer", count: statRelancer },
                  { key: "bloques", label: "Bloqués", count: statBloques },
                  { key: "ouverts", label: "Ouverts", count: statOuverts },
                ].map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key}>
                    {tab.label}
                    <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[9px] font-black text-[#2D2A56]">{tab.count}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Right Tools Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
              {/* Search text input */}
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Code, ville, gérant..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200/60 pl-9 pr-8 py-2.5 text-[10.5px] font-bold text-slate-700 placeholder-slate-400 outline-none focus:border-[#2D2A56] focus:bg-white focus:ring-2 focus:ring-[#2D2A56]/5 transition-all uppercase tracking-wider shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Custom Enseigne / Network Dropdown */}
              <div className="relative min-w-[170px] network-dropdown-container">
                <button
                  type="button"
                  onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200/20 pl-4 pr-8 py-2.5 text-[10.5px] font-bold text-[#2D2A56] uppercase tracking-wider outline-none flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors shadow-sm"
                >
                  <span>{selectedNetwork}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-[#2D2A56] transition-transform duration-200 ${isNetworkDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isNetworkDropdownOpen && (
                    <motion.div
                      key="network-dropdown-menu"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-30 top-full mt-2 left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5"
                    >
                      {["Toutes enseignes", "Norauto", "Speedy", "Feu Vert", "Indépendant"].map((network) => (
                        <button
                          key={network}
                          type="button"
                          onClick={() => {
                            setSelectedNetwork(network);
                            setIsNetworkDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer rounded-lg mb-0.5 last:mb-0 ${
                            selectedNetwork === network
                              ? "bg-[#EA5B2D]/10 text-[#EA5B2D]"
                              : "text-slate-600 hover:bg-slate-50 hover:text-[#2D2A56]"
                          }`}
                        >
                          {network}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Table / Kanban view toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "tableau" | "kanban")} className="shrink-0">
                <TabsList>
                  <TabsTrigger value="tableau"><List className="h-3.5 w-3.5" /> Tableau</TabsTrigger>
                  <TabsTrigger value="kanban"><KanbanIcon className="h-3.5 w-3.5" /> Kanban</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* 4. CONDITIONAL PRESENTATION */}
          {isLoading && dossiersList.length === 0 ? (
            <SkeletonTable rows={8} cols={5} />
          ) : (
          <AnimatePresence mode="wait">
            {viewMode === "tableau" ? (
              <DossiersTable
                displayedDossiers={displayedDossiers}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                goToPage={setCurrentPage}
                onOpenDossier={onOpenDossier}
                onAdvance={handleAdvance}
              />
            ) : (
              <DossiersKanban
                filteredDossiers={filteredDossiers}
                draggedId={draggedId}
                activeDropCol={activeDropCol}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onOpenDossier={onOpenDossier}
              />
            )}
          </AnimatePresence>
          )}

        </div>
      </div>
    </div>
  );
}

