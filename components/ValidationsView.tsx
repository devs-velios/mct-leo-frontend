"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Search,
  Calendar,
  Eye,
  ShieldCheck,
  FolderOpen,
  FolderInput,
  Pencil,
  XCircle,
  ExternalLink,
  ChevronDown,
  X,
  Menu,
  IdCard,
  ArrowUpDown,
  MoreHorizontal
} from "lucide-react";
import { type ValidationItem, queueItemToValidation } from "./validations/validationsData";
import RejectModal from "./validations/RejectModal";
import PreviewModal, { type PreviewTarget } from "./validations/PreviewModal";
import MoveModal from "./validations/MoveModal";
import { type SelectOption } from "@/components/ui/Select";
import { usePiecesContext } from "@/lib/features/pieces";
import { useFoldersContext } from "@/lib/features/folders";
import { useDialog } from "@/components/ui/DialogProvider";
import { SkeletonCards } from "@/components/ui/Skeleton";
import Tooltip from "@/components/ui/Tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ValidationsViewProps {
  setMobileMenuOpen: (open: boolean) => void;
  onOpenDossier?: (id: string) => void;
}

// Canonical Drive folders — fallback for the "Déplacer" picker when none are configured.
const DEFAULT_FOLDERS = [
  "02_Administratif",
  "03_Plans",
  "04_Controleurs",
  "05_Engagements",
  "06_Agrements",
  "07_Studio",
  "99_A_identifier",
];

// User-friendly French names (the dropdown hides the technical "NN_" folder codes).
const FOLDER_LABELS: Record<string, string> = {
  "02_Administratif": "Administratif",
  "03_Plans": "Plans",
  "04_Controleurs": "Contrôleurs",
  "05_Engagements": "Engagements",
  "06_Agrements": "Agréments",
  "07_Studio": "Studio",
  "99_A_identifier": "À identifier",
};

/** Friendly label for a folder: known mapping, else strip the leading code + underscores. */
function friendlyFolder(name: string, label?: string | null): string {
  if (FOLDER_LABELS[name]) return FOLDER_LABELS[name];
  const base = (label && label.trim()) || name;
  return base.replace(/^\d+[\s_-]*/, "").replace(/_/g, " ").trim() || name;
}

// Solid tone for the corner status badge.
// Calm, de-saturated status tones (soft tint + readable text — no solid fills).
const STATUS_TONE: Record<string, string> = {
  "À valider": "bg-slate-100 text-slate-600",
  "À identifier": "bg-amber-50 text-amber-700",
  "Validé": "bg-emerald-50 text-emerald-700",
  "Rejeté": "bg-rose-50 text-rose-700",
};

// Human-readable document type (avoids showing raw enum values).
const DOC_LABEL: Record<string, string> = {
  agrement_prefectoral: "Agrément préfectoral",
  kbis: "Kbis",
  assurance: "Assurance",
  piece_identite: "Pièce d'identité",
  autre: "Autre",
};
const docLabel = (t?: string) =>
  !t ? "—" : DOC_LABEL[t] ?? t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export default function ValidationsView({ setMobileMenuOpen, onOpenDossier }: ValidationsViewProps) {
  // Backend validation queue: already joined with centre info + a real workflow statut.
  const { queue, isQueueLoading: isLoading, ensureQueue, verify, move, rename, reject } = usePiecesContext();
  const { folders, ensureLoaded: ensureFolders } = useFoldersContext();
  const { prompt, confirm } = useDialog();
  const [validationsList, setValidationsList] = useState<ValidationItem[]>([]);

  useEffect(() => { ensureQueue(); }, [ensureQueue]);
  useEffect(() => { ensureFolders(); }, [ensureFolders]);
  useEffect(() => {
    setValidationsList(queue.map(queueItemToValidation));
  }, [queue]);
  const [selectedTab, setSelectedTab] = useState("tout"); // tout, à valider, à identifier, kbis, assurance, pièce id
  const [selectedConfFilter, setSelectedConfFilter] = useState<"all" | "high" | "low">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<{ key: "recuLe" | "confIA" | "status"; order: "asc" | "desc" }>({ key: "recuLe", order: "desc" });
  const [dateFilter, setDateFilter] = useState("toutes");
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState<ValidationItem | null>(null);
  // In-app document preview state
  const [previewItem, setPreviewItem] = useState<PreviewTarget | null>(null);
  // Move (reclassify) modal state
  const [movingItem, setMovingItem] = useState<ValidationItem | null>(null);

  // Destination folder options (configured folders, else canonical fallback) — friendly labels.
  const folderOptions = useMemo<SelectOption[]>(() => {
    const configured = [...folders]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((f) => ({ value: f.name, label: friendlyFolder(f.name, f.label) }));
    return configured.length > 0
      ? configured
      : DEFAULT_FOLDERS.map((n) => ({ value: n, label: friendlyFolder(n) }));
  }, [folders]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handle outside click to close the date dropdown
  useEffect(() => {
    if (!isDateDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".date-dropdown-container")) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isDateDropdownOpen]);

  // Reset page when tab/filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, selectedConfFilter, searchQuery, dateFilter]);

  // Filter validations based on selections
  const filteredValidations = validationsList.filter((item) => {
    // 1. Text Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchCode = item.code.toLowerCase().includes(query);
      const matchNom = item.nom.toLowerCase().includes(query);
      const matchDetail = item.detail.toLowerCase().includes(query);
      if (!matchCode && !matchNom && !matchDetail) return false;
    }

    // 2. Status tabs (tab keys are the status labels themselves)
    if (selectedTab !== "tout" && item.status !== selectedTab) return false;

    // 3. Confidence level toggles
    if (selectedConfFilter === "high") {
      if (item.confIA < 90) return false;
    } else if (selectedConfFilter === "low") {
      if (item.confIA >= 70) return false;
    }

    // 4. Date ranges (real timestamps)
    if (dateFilter !== "toutes" && item.createdAt) {
      const created = new Date(item.createdAt);
      const now = new Date();
      if (dateFilter === "aujourdhui") {
        if (created.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === "semaine") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
        if (created < sevenDaysAgo) return false;
      }
    }

    return true;
  });

  // Calculate dynamic stats
  const countEnAttente = validationsList.length;
  const countAIdentifier = validationsList.filter((v) => v.status === "À identifier").length;
  const countValidees = validationsList.filter((v) => v.status === "Validé").length;
  const averageConfidence = Math.round(
    validationsList.reduce((acc, curr) => acc + curr.confIA, 0) / (validationsList.length || 1)
  );

  // Actions — all routed through the shared pieces cache context.
  const handleValidateItem = async (id: number, code: string) => {
    const item = validationsList.find((v) => v.id === id);
    if (!item?.pieceId) return;
    // Deliberate, explicit validation: confirm first (the client is notified on validate).
    const ok = await confirm({
      title: `Valider « ${item.docType} » ?`,
      message: `La pièce de ${code} sera marquée comme validée par un humain, et le client en sera informé par WhatsApp.`,
      confirmLabel: "Valider la pièce",
    });
    if (!ok) return;
    try {
      await verify(item.pieceId); // context flips the piece to validated → row re-derives
      setToastMessage(`Pièce « ${item.docType} » (${code}) validée avec succès.`);
    } catch {
      setToastMessage(`Échec de la validation de ${code}.`);
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectingItem) return;
    const item = rejectingItem;
    setRejectingItem(null);
    setToastMessage(`Dossier ${item.code} rejeté (${reason}).`);
    if (item.pieceId) {
      try {
        await reject(item.pieceId, reason); // persisted on the backend (rejet_raison + statut)
      } catch {
        setToastMessage(`Échec du rejet de ${item.code}.`);
      }
    }
  };

  // Move (reclassify) a piece into another Drive folder — opens the on-brand picker modal.
  const handleMove = (item: ValidationItem) => {
    if (item.pieceId) setMovingItem(item);
  };

  const handleConfirmMove = async (folder: string) => {
    const item = movingItem;
    setMovingItem(null);
    if (!item?.pieceId) return;
    try {
      await move(item.pieceId, folder);
      setToastMessage(`« ${item.docType} » déplacé vers ${friendlyFolder(folder)}.`);
    } catch {
      setToastMessage("Échec du déplacement.");
    }
  };

  // Rename a piece's file.
  const handleRename = async (item: ValidationItem) => {
    if (!item.pieceId) return;
    const res = await prompt({
      title: "Renommer le fichier",
      submitLabel: "Renommer",
      fields: [{ name: "newName", label: "Nouveau nom du fichier", defaultValue: `${item.docType}.pdf`, required: true }],
    });
    if (!res) return;
    try {
      await rename(item.pieceId, res.newName);
      setToastMessage(`Renommé en ${res.newName}.`);
    } catch {
      setToastMessage("Échec du renommage.");
    }
  };

  // Sort, then paginate.
  const sortedValidations = [...filteredValidations].sort((a, b) => {
    let cmp = 0;
    if (sort.key === "confIA") cmp = a.confIA - b.confIA;
    else if (sort.key === "status") cmp = a.status.localeCompare(b.status);
    else cmp = new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
    return sort.order === "asc" ? cmp : -cmp;
  });

  // Pagination calculation
  const totalItems = sortedValidations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedItems = sortedValidations.slice(startIndex, endIndex);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">

      {/* 1. Header with dynamic stats (No Search/Actions in Header) */}
      <header className="px-4 sm:px-6 py-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 bg-white border-b border-slate-100 relative z-10 shrink-0 w-full min-w-0">
        <div className="w-full xl:w-auto">
          <div className="flex items-center justify-between md:hidden mb-2 w-full">
            <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <h2 className="text-2xl font-bold font-serif-mct text-[#332151] tracking-tight">
            À traiter
          </h2>
        </div>
      </header>

      {/* Main content body with tables and filters */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 w-full min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Stats Cards (minimal) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {[
              { label: "En attente", value: countEnAttente, Icon: Clock, tone: "bg-slate-100 text-[#332151]" },
              { label: "À identifier", value: countAIdentifier, Icon: AlertCircle, tone: "bg-slate-100 text-[#332151]" },
              { label: "Validées auj.", value: countValidees, Icon: CheckCircle2, tone: "bg-slate-100 text-[#332151]" },
              { label: "Conf. IA", value: `${countEnAttente > 0 ? averageConfidence : 100}%`, Icon: Cpu, tone: "bg-slate-100 text-[#332151]" },
            ].map(({ label, value, Icon, tone }) => (
              <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold leading-none text-[#332151]">{value}</p>
                  <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                key="toast-notification"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-emerald-600 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-lg flex items-center justify-between"
              >
                <span>{toastMessage}</span>
                <button onClick={() => setToastMessage(null)} className="cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2. Premium Filters Section */}
          <div className="relative z-20 bg-white p-6 rounded-3xl shadow-[0_10px_35px_rgba(45,42,86,0.02)] border border-slate-100/50 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div>
                <h3 className="text-xs font-black text-[#332151] uppercase tracking-widest">
                  ADVANCED FILTERS
                </h3>
                <p className="text-[10px] font-semibold text-slate-400 mt-1">
                  Search and filter the files to be validated by phase or AI confidence level
                </p>
              </div>

              {/* Filter controls row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                {/* Search query input */}
                <div className="relative flex-1 min-w-[220px]">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="SEARCH FOLDER, NAME..."
                    className="w-full rounded-xl bg-slate-50 border border-slate-200/60 pl-9 pr-8 py-2.5 text-[10px] font-bold text-slate-700 placeholder-slate-400 uppercase tracking-wider outline-none focus:border-[#332151] focus:bg-white transition-all shadow-sm"
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

                {/* Custom Date filter dropdown */}
                <div className="relative min-w-[170px] date-dropdown-container">
                  <button
                    type="button"
                    onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                    className="w-full rounded-xl bg-slate-50 pl-9 pr-8 py-2.5 text-[10px] font-bold text-[#332151] uppercase tracking-wider outline-none flex items-center justify-between cursor-pointer hover:bg-slate-100/80 transition-colors shadow-sm border border-slate-200/20"
                  >
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[#332151]">
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <span>{dateFilter === "toutes" ? "Toutes les dates" : dateFilter === "aujourdhui" ? "Aujourd'hui" : "Cette semaine"}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-[#332151] transition-transform duration-200 ${isDateDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isDateDropdownOpen && (
                      <motion.div
                        key="date-dropdown-menu"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-30 top-full mt-2 left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5"
                      >
                        {[
                          { key: "toutes", label: "Toutes les dates" },
                          { key: "aujourdhui", label: "Aujourd'hui" },
                          { key: "semaine", label: "Cette semaine" }
                        ].map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              setDateFilter(option.key);
                              setIsDateDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer rounded-lg mb-0.5 last:mb-0 ${
                              dateFilter === option.key
                                ? "bg-[#E34F2D]/10 text-[#E34F2D]"
                                : "text-slate-600 hover:bg-slate-50 hover:text-[#332151]"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Bottom Category Filter Chips & IA Confidence tags */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-slate-100/60">
              {/* Left filter tabs */}
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="flex-wrap">
                  {[
                    { key: "tout", label: "Tous" },
                    { key: "À identifier", label: "À identifier" },
                    { key: "À valider", label: "À valider" },
                    { key: "Validé", label: "Validés" },
                    { key: "Rejeté", label: "Rejetés" },
                  ].map((tab) => (
                    <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Right IA Confidence chips */}
              <div className="flex items-center gap-1.5 bg-slate-100/60 p-1.5 rounded-xl w-fit shrink-0">
                <button
                  onClick={() => setSelectedConfFilter(selectedConfFilter === "high" ? "all" : "high")}
                  className={`px-3.5 py-1.5 text-[10px] font-extrabold rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                    selectedConfFilter === "high"
                      ? "bg-white text-[#332151] shadow-sm"
                      : "text-[#5A5A7A] hover:text-[#332151] hover:bg-white/50"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Conf. &gt; 90%</span>
                </button>
                <button
                  onClick={() => setSelectedConfFilter(selectedConfFilter === "low" ? "all" : "low")}
                  className={`px-3.5 py-1.5 text-[10px] font-extrabold rounded-lg transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                    selectedConfFilter === "low"
                      ? "bg-white text-[#332151] shadow-sm"
                      : "text-[#5A5A7A] hover:text-[#332151] hover:bg-white/50"
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Conf. &lt; 70%</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Validations table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100/50 overflow-hidden">

            {/* Search + sort toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une pièce…"
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold text-[#332151]">
                    <ArrowUpDown className="h-3.5 w-3.5" /> Trier
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[210px]">
                  <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={sort.key} onValueChange={(k) => setSort((s) => ({ ...s, key: k as typeof s.key }))}>
                    <DropdownMenuRadioItem value="recuLe">Date de réception</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="confIA">Confiance IA</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="status">Statut</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={sort.order} onValueChange={(o) => setSort((s) => ({ ...s, order: o as "asc" | "desc" }))}>
                    <DropdownMenuRadioItem value="desc">Décroissant</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="asc">Croissant</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isLoading && validationsList.length === 0 ? (
              <div className="p-6"><SkeletonCards count={6} /></div>
            ) : (
              <Table className="min-w-[820px]">
                <TableHeader className="bg-slate-50/70">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-5">Pièce</TableHead>
                    <TableHead className="w-[96px] px-3 text-center">Confiance</TableHead>
                    <TableHead className="w-[140px] px-3">Reçu le</TableHead>
                    <TableHead className="w-[120px] px-3">Statut</TableHead>
                    <TableHead className="w-[150px] px-5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedItems.map((item) => {
                    const ville = item.detail.includes("—") ? item.detail.split("—").pop()?.trim() : "";
                    return (
                    <TableRow key={item.id} className="cursor-pointer group" onClick={() => { if (item.centreId) onOpenDossier?.(item.centreId); }}>
                      {/* Primary: centre (title) + merged metadata (type · code · ville) */}
                      <TableCell className="px-5">
                        <p className="text-sm font-bold text-[#332151] group-hover:text-[#E34F2D] transition-colors">{item.nom}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          <span className="font-medium text-[#5A5A7A]">{docLabel(item.docType)}</span>
                          <span className="text-slate-300"> · </span>
                          <span className="font-mono">{item.code}</span>
                          {ville && <><span className="text-slate-300"> · </span>{ville}</>}
                        </p>
                        {item.status === "Rejeté" && item.rejetRaison && (
                          <p className="mt-0.5 text-[11px] italic text-rose-500/90">Rejet : {item.rejetRaison}</p>
                        )}
                      </TableCell>

                      {/* Confidence — small, de-emphasised */}
                      <TableCell className="w-[96px] px-3 text-center">
                        <span className="text-xs font-semibold tabular-nums text-slate-500">{item.confIA}%</span>
                      </TableCell>

                      {/* Date — consistent alignment */}
                      <TableCell className="w-[140px] px-3 whitespace-nowrap text-xs text-slate-500 tabular-nums">{item.recuLe}</TableCell>

                      {/* Status — the visual anchor */}
                      <TableCell className="w-[120px] px-3">
                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold ${STATUS_TONE[item.status] ?? "bg-slate-500 text-white"}`}>{item.status}</span>
                      </TableCell>

                      {/* Actions — 2 decisions + overflow menu */}
                      <TableCell className="w-[150px] px-5">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="icon"
                            title="Valider la pièce"
                            onClick={() => handleValidateItem(item.id, item.code)}
                            className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-emerald-600"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title="Rejeter la pièce"
                            onClick={() => setRejectingItem(item)}
                            className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#5A5A7A]">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]">
                              <DropdownMenuItem onClick={() => setPreviewItem({ driveLink: item.driveLink, docType: item.docType, code: item.code })}>
                                <Eye /> Aperçu
                              </DropdownMenuItem>
                              {item.hasDrive && item.driveLink && (
                                <DropdownMenuItem onClick={() => window.open(item.driveLink!, "_blank", "noopener")}>
                                  <ExternalLink /> Ouvrir le Drive
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => { if (item.centreId) onOpenDossier?.(item.centreId); }}>
                                <FolderOpen /> Voir les pièces
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMove(item)}>
                                <FolderInput /> Déplacer
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRename(item)}>
                                <Pencil /> Renommer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {displayedItems.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="py-12 text-center text-sm font-semibold text-slate-400">
                        Aucun document ne correspond à vos filtres.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {/* Pagination Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-slate-100">
              <span className="text-[10px] font-extrabold text-[#5A5A7A] uppercase tracking-wider">
                Affichage de {totalItems > 0 ? startIndex + 1 : 0} à {Math.min(endIndex, totalItems)} sur {totalItems} validations
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-150 flex items-center gap-1 cursor-pointer ${
                    currentPage === 1
                      ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                      : "bg-white border border-slate-200 text-[#332151] hover:bg-slate-50 active:scale-95 shadow-sm"
                  }`}
                >
                  Précédent
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-7 w-7 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                      currentPage === page
                        ? "bg-[#332151] text-white shadow-sm"
                        : "bg-white border border-slate-200 text-[#332151] hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all duration-150 flex items-center gap-1 cursor-pointer ${
                    currentPage === totalPages
                      ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                      : "bg-white border border-slate-200 text-[#332151] hover:bg-slate-50 active:scale-95 shadow-sm"
                  }`}
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Modal: Rejection Form Dialog */}
      <RejectModal
        item={rejectingItem}
        onClose={() => setRejectingItem(null)}
        onConfirm={handleConfirmReject}
      />

      {/* In-app document preview */}
      <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />

      {/* Move (reclassify) picker */}
      <MoveModal
        item={movingItem ? { code: movingItem.code, docType: movingItem.docType } : null}
        options={folderOptions}
        onClose={() => setMovingItem(null)}
        onConfirm={handleConfirmMove}
      />

    </div>
  );
}

