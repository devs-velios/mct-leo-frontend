"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Eye,
  ShieldCheck,
  FolderOpen,
  FolderInput,
  Pencil,
  XCircle,
  ExternalLink,
  Menu,
  ArrowUpDown,
  MoreHorizontal
} from "lucide-react";
import RejectModal from "./validations/RejectModal";
import PreviewModal, { type PreviewTarget } from "./validations/PreviewModal";
import MoveModal from "./validations/MoveModal";
import {
  usePiecesContext,
  type ValidationItem,
  queueItemToValidation,
  pieceTypeLabel,
  filterValidations,
  highConfidencePending,
} from "@/lib/features/pieces";
import { useFoldersContext, friendlyFolder, destinationFolderOptions } from "@/lib/features/folders";
import { useDriveContext } from "@/lib/features/drive";
import { useCentresContext } from "@/lib/features/centres";
import { useDialog } from "@/components/ui/DialogProvider";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { DataTable } from "@/components/ui/data-table";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { useRowSelection } from "@/components/hooks/useRowSelection";
import { Button } from "@/components/ui/button";
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

// Calm, de-saturated status tones (soft tint + readable text — no solid fills).
const STATUS_TONE: Record<string, string> = {
  "À valider": "bg-slate-100 text-slate-600",
  "À identifier": "bg-amber-50 text-amber-700",
  "Validé": "bg-emerald-50 text-emerald-700",
  "Rejeté": "bg-rose-50 text-rose-700",
};

// Filter-button options.
const STATUT_OPTIONS: MultiSelectOption[] = [
  { value: "À identifier", label: "À identifier" },
  { value: "À valider", label: "À valider" },
  { value: "Validé", label: "Validés" },
  { value: "Rejeté", label: "Rejetés" },
];
const CONF_OPTIONS: MultiSelectOption[] = [
  { value: "high", label: "Fiable (> 90%)" },
  { value: "low", label: "Faible (< 70%)" },
];

export default function ValidationsView({ setMobileMenuOpen, onOpenDossier }: ValidationsViewProps) {
  // Backend validation queue: already joined with centre info + a real workflow statut.
  const { queue, isQueueLoading: isLoading, ensureQueue, verify, bulkVerify, move, rename, reject } = usePiecesContext();
  const { folders, ensureLoaded: ensureFolders } = useFoldersContext();
  // Live Drive root listing — the actual folders a piece can be moved into.
  const { byPath: driveByPath, browse: driveBrowse } = useDriveContext();
  // Warm the centre detail cache on hover so opening a piece's centre is instant.
  const { getDetail: prefetchCentre } = useCentresContext();
  const { prompt, confirm } = useDialog();
  const [validationsList, setValidationsList] = useState<ValidationItem[]>([]);

  useEffect(() => { ensureQueue(); }, [ensureQueue]);
  useEffect(() => { ensureFolders(); }, [ensureFolders]);
  useEffect(() => { driveBrowse(""); }, [driveBrowse]); // load Drive root for destinations
  useEffect(() => {
    setValidationsList(queue.map(queueItemToValidation));
  }, [queue]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statutSel, setStatutSel] = useState<string[]>([]);
  const [confSel, setConfSel] = useState<string[]>([]);
  const [docTypeSel, setDocTypeSel] = useState<string[]>([]);
  const [sort, setSort] = useState<{ key: "recuLe" | "confIA" | "status"; order: "asc" | "desc" }>({ key: "recuLe", order: "desc" });

  // Route a message to a success or error toast based on its wording.
  const notify = (msg: string) => (/échec|erreur/i.test(msg) ? toast.error(msg) : toast.success(msg));

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState<ValidationItem | null>(null);
  // In-app document preview state
  const [previewItem, setPreviewItem] = useState<PreviewTarget | null>(null);
  // Move (reclassify) modal state
  const [movingItem, setMovingItem] = useState<ValidationItem | null>(null);

  // Destination folder options — dynamic, with friendly labels. Priority:
  //  1. Configured routing folders (Dossiers & Routage), when any are set up.
  //  2. The live Drive root folders (the real directories that exist).
  //  3. Canonical hardcoded list — last-resort fallback only.
  const folderOptions = useMemo(
    () => destinationFolderOptions(folders, driveByPath[""]?.folders ?? []),
    [folders, driveByPath],
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statutSel, confSel, docTypeSel, searchQuery]);

  // Distinct document types present (feeds the "Type de document" filter button).
  const docTypeOptions = useMemo<MultiSelectOption[]>(() => {
    const seen = [...new Set(validationsList.map((v) => v.docType).filter(Boolean))];
    return seen.sort((a, b) => pieceTypeLabel(a).localeCompare(pieceTypeLabel(b))).map((t) => ({ value: t, label: pieceTypeLabel(t) }));
  }, [validationsList]);

  // Filtering rules live in the pieces feature (single source of truth).
  const filteredValidations = filterValidations(validationsList, {
    search: searchQuery,
    statuts: statutSel,
    confs: confSel,
    docTypes: docTypeSel,
  });

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
      notify(`Pièce « ${item.docType} » (${code}) validée avec succès.`);
    } catch {
      notify(`Échec de la validation de ${code}.`);
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectingItem) return;
    const item = rejectingItem;
    setRejectingItem(null);
    notify(`Dossier ${item.code} rejeté (${reason}).`);
    if (item.pieceId) {
      try {
        await reject(item.pieceId, reason); // persisted on the backend (rejet_raison + statut)
      } catch {
        notify(`Échec du rejet de ${item.code}.`);
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
      notify(`« ${item.docType} » déplacé vers ${friendlyFolder(folder)}.`);
    } catch {
      notify("Échec du déplacement.");
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
      notify(`Renommé en ${res.newName}.`);
    } catch {
      notify("Échec du renommage.");
    }
  };

  // Bulk validation for high-confidence clusters — the eligible pending pieces in
  // the current filter (rule + the per-piece loop both live in the pieces feature).
  const bulkPending = highConfidencePending(filteredValidations);
  const handleBulkValidate = async () => {
    if (bulkPending.length === 0) return;
    const ok = await confirm({
      title: `Valider ${bulkPending.length} pièce${bulkPending.length > 1 ? "s" : ""} fiable${bulkPending.length > 1 ? "s" : ""} ?`,
      message: "Toutes les pièces en attente avec une confiance IA ≥ 90 % seront validées, et les clients notifiés par WhatsApp.",
      confirmLabel: "Tout valider",
    });
    if (!ok) return;
    const done = await bulkVerify(bulkPending.map((v) => v.pieceId!));
    notify(`${done} pièce${done > 1 ? "s" : ""} validée${done > 1 ? "s" : ""}.`);
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

  // Row selection (per-row + select-all checkboxes), scoped to the filtered set.
  const selection = useRowSelection(sortedValidations.map((v) => String(v.id)));

  // Bulk-validate the SELECTED rows (pending pieces only) — "validate clusters in bulk".
  const handleBulkValidateSelected = async () => {
    const ids = new Set(selection.selectedIds);
    const pieceIds = sortedValidations
      .filter((v) => ids.has(String(v.id)) && v.pieceId && (v.status === "À valider" || v.status === "À identifier"))
      .map((v) => v.pieceId!);
    if (pieceIds.length === 0) {
      notify("Aucune pièce en attente dans la sélection.");
      return;
    }
    const ok = await confirm({
      title: `Valider ${pieceIds.length} pièce${pieceIds.length > 1 ? "s" : ""} ?`,
      message: "Les pièces sélectionnées en attente seront validées, et les clients notifiés par WhatsApp.",
      confirmLabel: "Valider la sélection",
    });
    if (!ok) return;
    const done = await bulkVerify(pieceIds);
    notify(`${done} pièce${done > 1 ? "s" : ""} validée${done > 1 ? "s" : ""}.`);
    selection.clear();
  };

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

          <h2 className="text-lg sm:text-2xl font-bold font-serif-mct text-[#332151] tracking-tight">
            Validations
          </h2>
          <p className="mt-0.5 text-xs text-[#5A5A7A]">
            Tous les documents entrants nécessitant une validation.
          </p>
        </div>
      </header>

      {/* Main content body with tables and filters */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 w-full min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">


          {/* Search + filter buttons (shared toolbar, identical to Centres) */}
          <TableToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Rechercher une pièce…"
          >
            <MultiSelect
              options={STATUT_OPTIONS}
              selected={statutSel}
              onChange={setStatutSel}
              placeholder="Statut"
              searchPlaceholder="Rechercher un statut…"
              emptyText="Aucun statut."
            />
            <MultiSelect
              options={CONF_OPTIONS}
              selected={confSel}
              onChange={setConfSel}
              placeholder="Confiance"
              searchPlaceholder="Rechercher…"
              emptyText="Aucune option."
            />
            <MultiSelect
              options={docTypeOptions}
              selected={docTypeSel}
              onChange={setDocTypeSel}
              placeholder="Type de document"
              searchPlaceholder="Rechercher un type…"
              emptyText="Aucun type."
              listClassName="max-h-[220px]"
            />
            {bulkPending.length > 0 && (
              <Button
                size="sm"
                onClick={handleBulkValidate}
                className="gap-1.5 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                title="Valider toutes les pièces fiables en attente"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Valider fiables <span className="rounded bg-white/25 px-1.5 py-0.5 text-[10px] font-black">{bulkPending.length}</span>
              </Button>
            )}
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
          </TableToolbar>

          {/* 3. Validations table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100/50 overflow-hidden">

            {isLoading && validationsList.length === 0 ? (
              <div className="p-6"><SkeletonCards count={6} /></div>
            ) : (
              <div className="px-4 sm:px-5 pt-2">
                <DataTable<ValidationItem>
                  data={displayedItems}
                  getRowId={(item) => String(item.id)}
                  minWidth="900px"
                  hideToolbar
                  bare
                  selection={selection}
                  onRowClick={(item) => { if (item.centreId) onOpenDossier?.(item.centreId); }}
                  onRowHover={(item) => { if (item.centreId) void prefetchCentre(item.centreId).catch(() => {}); }}
                  emptyMessage="Aucun document ne correspond à vos filtres."
                  columns={[
                    {
                      id: "piece",
                      header: "Pièce",
                      width: "minmax(280px,2fr)",
                      cell: (item) => (
                        <div className="min-w-0">
                          {/* line 1 — garage / centre name */}
                          <p className="truncate text-sm font-semibold text-[#332151] transition-colors group-hover:text-[#E34F2D]">{item.nom}</p>
                          {/* line 2 — document type (readable label) */}
                          <p className="truncate text-[12px] font-medium text-[#5A5A7A]">{pieceTypeLabel(item.docType)}</p>
                          {item.fileName && (item.hasDrive && item.driveLink ? (
                            <a
                              href={item.driveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Ouvrir le fichier lié dans le Drive"
                              className="mt-0.5 inline-flex max-w-full items-center gap-1 font-mono text-[11px] text-[#5A5A7A] hover:text-[#E34F2D]"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" /> <span className="truncate">{item.fileName}</span>
                            </a>
                          ) : (
                            <span className="mt-0.5 block truncate font-mono text-[11px] text-slate-400">{item.fileName}</span>
                          ))}
                          {item.status === "Rejeté" && item.rejetRaison && (
                            <p className="mt-0.5 text-[11px] italic text-rose-500/90">Rejet : {item.rejetRaison}</p>
                          )}
                          {/* small bottom — centre number / reference */}
                          <span className="mt-1 block font-mono text-[10px] text-slate-400">{item.code}</span>
                        </div>
                      ),
                    },
                    {
                      id: "statut",
                      header: "Statut",
                      width: "120px",
                      cell: (item) => (
                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold ${STATUS_TONE[item.status] ?? "bg-slate-500 text-white"}`}>{item.status}</span>
                      ),
                    },
                    {
                      id: "confIA",
                      header: "Confiance IA",
                      width: "100px",
                      align: "center",
                      cell: (item) => (
                        <span className="text-xs font-semibold tabular-nums text-slate-500">{item.confIA}%</span>
                      ),
                    },
                    {
                      id: "recuLe",
                      header: "Reçu le",
                      width: "140px",
                      cell: (item) => (
                        <span className="whitespace-nowrap text-xs text-slate-500 tabular-nums">{item.recuLe}</span>
                      ),
                    },
                    {
                      id: "actions",
                      header: "Actions",
                      width: "150px",
                      align: "right",
                      cell: (item) => (
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {(item.status === "À valider" || item.status === "À identifier") && (
                            <>
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
                            </>
                          )}
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
                      ),
                    },
                  ]}
                />
              </div>
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

      {/* Bulk validation bar — appears when rows are selected. */}
      {selection.count > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          <span className="text-xs font-bold text-[#332151]">{selection.count} sélectionné{selection.count > 1 ? "s" : ""}</span>
          <Button
            size="sm"
            onClick={handleBulkValidateSelected}
            className="gap-1.5 bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Valider la sélection
          </Button>
          <button onClick={selection.clear} className="text-xs font-bold text-[#5A5A7A] transition-colors hover:text-[#332151]">
            Annuler
          </button>
        </div>
      )}

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

