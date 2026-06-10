"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, ChevronDown, User, MapPin, Menu, Clock } from "lucide-react";
import { type Conversation } from "@/lib/features/conversations";
import { Skeleton } from "@/components/ui/Skeleton";

interface ConversationsListProps {
  conversations: Conversation[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedPhase: string;
  setSelectedPhase: (value: string) => void;
  isPhaseDropdownOpen: boolean;
  setIsPhaseDropdownOpen: (value: boolean) => void;
  onSelectConversation: (id: string) => void;
  onOpenDossier?: (id: string) => void;
  setMobileMenuOpen?: (open: boolean) => void;
  loading?: boolean;
}

export default function ConversationsList({
  conversations,
  searchQuery,
  setSearchQuery,
  selectedPhase,
  setSelectedPhase,
  isPhaseDropdownOpen,
  setIsPhaseDropdownOpen,
  onSelectConversation,
  onOpenDossier,
  setMobileMenuOpen,
  loading
}: ConversationsListProps) {
  return (
    <motion.div
      key="list"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col h-full overflow-hidden w-full min-w-0"
    >
      {/* Header top bar */}
      <header className="px-4 sm:px-6 py-4 sm:py-6 bg-white border-b border-slate-100 shrink-0 relative z-10 w-full min-w-0">
        {setMobileMenuOpen && (
          <div className="flex items-center justify-between lg:hidden mb-2 w-full">
            <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A] mb-1 block">
          CANAL WHATSAPP
        </span>
        <h2 className="text-3xl font-extrabold font-serif-mct text-[#332151] tracking-tight">
          Conversations
        </h2>
        <p className="text-xs text-[#5A5A7A] mt-0.5">
          58 conversations WhatsApp suivies
        </p>
      </header>

      {/* Filter Bar container */}
      <div className="p-4 sm:p-6 pb-2 shrink-0 w-full min-w-0 relative z-20">
        <div className="max-w-[1400px] mx-auto bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-slate-100/50 flex flex-col sm:flex-row items-center justify-between gap-4 w-full min-w-0">

          {/* Search query box */}
          <div className="relative w-full sm:flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom de groupe ou ville..."
              className="w-full rounded-xl bg-slate-50 border border-slate-200/60 pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-[#332151] focus:bg-white transition-all font-semibold"
            />
          </div>

          {/* Custom Phase filter dropdown (without border, brand styled list) */}
          <div className="relative w-full sm:w-[180px] phase-dropdown-container">
            <button
              type="button"
              onClick={() => setIsPhaseDropdownOpen(!isPhaseDropdownOpen)}
              className="w-full rounded-xl bg-slate-50 pl-4 pr-8 py-2.5 text-xs font-bold text-[#332151] uppercase tracking-wider outline-none flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors shadow-sm"
            >
              <span>{selectedPhase}</span>
              <ChevronDown className={`h-4 w-4 text-[#332151] transition-transform duration-200 ${isPhaseDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isPhaseDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-30 top-full mt-2 left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5"
                >
                  {["Toutes phases", "Signature", "Onboarding", "Dépôt", "Ouvert", "Suivi"].map((phase) => (
                    <button
                      key={phase}
                      type="button"
                      onClick={() => {
                        setSelectedPhase(phase);
                        setIsPhaseDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer rounded-lg mb-0.5 last:mb-0 ${
                        selectedPhase === phase
                          ? "bg-[#E34F2D]/10 text-[#E34F2D]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-[#332151]"
                      }`}
                    >
                      {phase}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Grid display container */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto w-full min-w-0 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto grid gap-6 grid-cols-1 sm:grid-cols-2 w-full min-w-0">
          {loading && conversations.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-3xl border border-slate-100 bg-white p-5 space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))
            : conversations.map((conv) => {
            return (
              <motion.div
                key={conv.id}
                whileHover={{ y: -4, scale: 1.015 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => onSelectConversation(conv.id)}
                className="group p-5 sm:p-6 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.012)] border border-slate-100/80 hover:border-[#E34F2D]/20 hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)] transition-all flex flex-col justify-between gap-5 cursor-pointer relative overflow-hidden min-w-0"
              >
                {/* Top Row: Icon + Title & Subtitle + Phase */}
                <div className="flex items-start justify-between gap-4 min-w-0">
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Orange Message Icon Block */}
                    <div className="flex h-11 w-11 shrink-0 rounded-xl bg-orange-50 border border-orange-100/50 text-[#E34F2D] items-center justify-center relative shadow-sm">
                      <MessageSquare className="h-5 w-5" />
                    </div>

                    {/* Title and subtitle */}
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-[#332151] group-hover:text-[#E34F2D] transition-colors font-serif-mct leading-tight">
                        {conv.title}
                      </h4>
                      <p className="text-[11.5px] font-semibold text-slate-400 mt-1.5 truncate">
                        {conv.subtitle.replace(" - ", " · ")}
                      </p>
                    </div>
                  </div>

                  <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase border ${
                    conv.phase === "Signature"
                      ? "bg-slate-50 text-slate-600 border-slate-200"
                      : conv.phase === "Onboarding"
                        ? "bg-[#E34F2D]/10 text-[#E34F2D] border-[#E34F2D]/20"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                  }`}>
                    {conv.phase}
                  </span>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-3.5">
                  <span className="text-[10px] font-bold text-slate-400">
                    Dernière activité {conv.lastActivity}
                  </span>
                  <span className="flex items-center gap-1.5 text-[#E34F2D] text-[10px] font-extrabold transition-all group-hover:translate-x-0.5">
                    <span>Ouvrir le dossier</span>
                    <span>&rarr;</span>
                  </span>
                </div>
              </motion.div>
            );
          })}
          {!loading && conversations.length === 0 && (
            <div className="sm:col-span-2 py-20 text-center text-sm font-semibold text-[#5A5A7A]">
              Aucune conversation ne correspond à vos filtres.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

