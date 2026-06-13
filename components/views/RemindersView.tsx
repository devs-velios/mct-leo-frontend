"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu, Bell, XCircle, Trash2, Pencil, Plus, X, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRemindersContext, type Reminder } from "@/lib/features/reminders";
import { useDossiersContext, stageLabel } from "@/lib/features/dossiers";
import { useCentresContext } from "@/lib/features/centres";
import { pieceTypeLabel } from "@/lib/features/pieces";
import { useDialog } from "@/components/ui/DialogProvider";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { CentreCell, VilleCell } from "@/components/ui/centre-cell";
import { SingleSelect } from "@/components/ui/single-select";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { CityFilter } from "@/components/ui/city-filter";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
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
import { DateTimePicker } from "@/components/ui/date-time-picker";

// Human-readable status (no raw enum values shown to the operator).
const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  sent: "Envoyé",
  cancelled: "Annulé",
  escalated: "Escaladé",
  cancelled_by_client_reply: "Annulé (pièce reçue)",
};

// Calm, de-saturated status tones (soft tint, not solid fills).
const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  sent: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-600",
  escalated: "bg-rose-50 text-rose-700",
  cancelled_by_client_reply: "bg-slate-100 text-slate-600",
};

const KIND_LABEL: Record<string, string> = { auto: "Automatique", manual: "Manuel" };

// Status filter options (the two main states + the terminal ones).
const STATUT_OPTIONS: MultiSelectOption[] = [
  { value: "pending", label: "En attente" },
  { value: "sent", label: "Envoyé" },
  { value: "escalated", label: "Escaladé" },
  { value: "cancelled", label: "Annulé" },
];

// Escalation level → due-type badge. TODO(backend): expose the real échéance (J+7/15/30).
const DUE_BY_ESCALATION = ["J+7", "J+15", "J+30"];
const dueTypeOf = (escalation: number) =>
  escalation > 0 ? DUE_BY_ESCALATION[Math.min(escalation - 1, DUE_BY_ESCALATION.length - 1)] : null;

// Human reason for a reminder (the piece concerned), instead of a generic digest label.
const reminderReason = (piece?: string | null) =>
  piece ? `Relance pour la pièce : ${pieceTypeLabel(piece)}` : "Relance — récapitulatif des pièces manquantes";

const statusLabel = (s: string) => STATUS_LABEL[s] ?? s;
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function RemindersView({ setMobileMenuOpen, onOpenDossier }: { setMobileMenuOpen?: (o: boolean) => void; onOpenDossier?: (centreId: string) => void }) {
  const {
    reminders: items,
    isLoading: loading,
    ensureLoaded,
    create: createReminder,
    update: updateReminder,
    stop: stopReminder,
    remove: removeReminder,
  } = useRemindersContext();
  const { dossiers, ensureLoaded: ensureDossiers } = useDossiersContext();
  const { getDetail, detailCache } = useCentresContext();
  const { prompt } = useDialog();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ dossier_id: "", piece: "", message: "", scheduled_at: "" });
  // Reminder pending a destructive/irreversible action — drives the confirm AlertDialog.
  const [confirmAction, setConfirmAction] = useState<{ reminder: Reminder; kind: "delete" | "stop" } | null>(null);
  const [sort, setSort] = useState<{ key: "scheduled_at" | "status" | "centre"; order: "asc" | "desc" }>({ key: "scheduled_at", order: "desc" });
  const [searchQuery, setSearchQuery] = useState("");
  const [villeSel, setVilleSel] = useState<string[]>([]);
  const [statutSel, setStatutSel] = useState<string[]>([]);

  const closeModal = () => {
    setShowCreate(false);
    setEditingId(null);
    setForm({ dossier_id: "", piece: "", message: "", scheduled_at: "" });
  };

  // Cache-guarded loads via the shared contexts.
  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
  useEffect(() => { ensureDossiers(); }, [ensureDossiers]);

  // Resolve a reminder's dossier_id (UUID) → its centre, so cards show names not ids.
  const centreByDossier = useMemo(() => {
    const m = new Map<string, NonNullable<(typeof dossiers)[number]["centre"]>>();
    for (const d of dossiers) if (d.centre) m.set(d.id, d.centre);
    return m;
  }, [dossiers]);

  // Centre picker options (centre name + friendly stage) for the shared SingleSelect.
  const dossierOptions = useMemo(
    () => dossiers.map((d) => ({
      value: d.id,
      label: `${d.centre?.enseigne ?? d.centre?.code_centre ?? "—"} · ${stageLabel(d.etape_pipeline)}`,
    })),
    [dossiers],
  );

  // When a centre is picked, load its detail so the document picker can list its pièces.
  const selectedCentreId = useMemo(
    () => dossiers.find((d) => d.id === form.dossier_id)?.centre?.id ?? null,
    [dossiers, form.dossier_id],
  );
  useEffect(() => { if (selectedCentreId) void getDetail(selectedCentreId); }, [selectedCentreId, getDetail]);
  const pieceOptions = useMemo(() => {
    const d = selectedCentreId ? detailCache[selectedCentreId] : undefined;
    if (!d) return [] as { value: string; label: string }[];
    const codes = [...new Set([...(d.presentPieces ?? []), ...(d.missingPieces ?? [])])];
    return codes.map((c) => ({ value: c, label: pieceTypeLabel(c) }));
  }, [selectedCentreId, detailCache]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dossier_id || !form.scheduled_at) return;
    try {
      if (editingId) {
        await updateReminder(editingId, {
          scheduled_at: new Date(form.scheduled_at).toISOString(),
          message: form.message.trim() || null,
        });
      } else {
        await createReminder({
          dossier_id: form.dossier_id,
          piece: form.piece.trim() || null,
          message: form.message.trim() || null,
          scheduled_at: new Date(form.scheduled_at).toISOString(),
        });
      }
      closeModal();
    } catch {
      /* ignore */
    }
  };

  const stop = async (id: string) => {
    await stopReminder(id).catch(() => {});
  };

  const del = async (id: string) => {
    await removeReminder(id).catch(() => {});
  };

  // Edit reuses the same modal (with the date/time picker), pre-filled.
  const edit = (r: Reminder) => {
    setEditingId(r.id);
    setForm({
      dossier_id: r.dossier_id,
      piece: r.piece_attendue ?? "",
      message: r.message ?? "",
      scheduled_at: r.scheduled_at ?? "",
    });
    setShowCreate(true);
  };

  // Free-text search + city filter, resolved through the reminder's centre.
  const query = searchQuery.trim().toLowerCase();
  const filteredItems = items.filter((r) => {
    const centre = centreByDossier.get(r.dossier_id);
    const ville = centre?.ville ?? "";
    if (statutSel.length > 0 && !statutSel.includes(r.status)) return false;
    if (villeSel.length > 0 && !villeSel.includes(ville)) return false;
    if (query) {
      const hay = [centre?.enseigne, centre?.code_centre, ville].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  // Distinct cities present across the reminders (feeds the city filter popover).
  const cityList = items.map((r) => centreByDossier.get(r.dossier_id)?.ville);

  // Sort the reminders for the table (by date / statut / centre, asc or desc).
  const sortedItems = [...filteredItems].sort((a, b) => {
    let cmp = 0;
    if (sort.key === "status") {
      cmp = statusLabel(a.status).localeCompare(statusLabel(b.status));
    } else if (sort.key === "centre") {
      const ca = centreByDossier.get(a.dossier_id);
      const cb = centreByDossier.get(b.dossier_id);
      cmp = (ca?.enseigne ?? ca?.code_centre ?? "").localeCompare(cb?.enseigne ?? cb?.code_centre ?? "");
    } else {
      cmp = new Date(a.scheduled_at ?? 0).getTime() - new Date(b.scheduled_at ?? 0).getTime();
    }
    return sort.order === "asc" ? cmp : -cmp;
  });

  return (
    <>
      <header className="border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur lg:px-6">
        <div className="mb-3 flex items-center justify-between md:hidden">
          <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
          <button onClick={() => setMobileMenuOpen?.(true)} className="rounded-lg p-2 text-[#332151] hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-serif-mct text-base sm:text-xl font-bold text-[#332151]">Rappels</h1>
            <p className="text-xs text-[#5A5A7A]">Relances automatiques et manuelles des pièces manquantes</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5 text-xs font-bold shrink-0">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Créer un rappel</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/30">
        {loading ? (
          <SkeletonTable rows={6} cols={5} className="max-w-[1400px] mx-auto" />
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-md text-center py-12 px-4">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
              <Bell className="h-8 w-8" />
            </div>

            <h3 className="font-serif-mct text-lg font-bold text-[#332151]">
              Aucun rappel programmé
            </h3>
            <p className="mt-2 text-xs text-[#5A5A7A] leading-relaxed max-w-xs mx-auto">
              Tous vos rappels et relances automatiques ou manuels s'afficheront ici pour suivre les pièces manquantes.
            </p>

            {/* Nice card/div below the empty state statement */}
            <div className="group mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-[#E34F2D]/20 hover:shadow-[0_20px_45px_rgba(234,91,45,0.08)] transition-all duration-200 text-left relative">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Fonctionnement des relances</span>
                <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-[#E34F2D]">
                  Automatique
                </span>
              </div>
              <p className="text-[11px] text-[#5A5A7A] leading-relaxed">
                Les relances « auto » sont programmées et envoyées à l'ouverture d'un centre. 
                Vous pouvez également créer des rappels manuels ciblés à tout moment pour des dossiers spécifiques.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-[1400px] mx-auto space-y-4">
            {/* Search + filters (shared toolbar, identical to Centres) */}
            <TableToolbar
              search={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Rechercher par code, enseigne, ville..."
            >
              <MultiSelect
                options={STATUT_OPTIONS}
                selected={statutSel}
                onChange={setStatutSel}
                placeholder="Statut"
                searchPlaceholder="Rechercher un statut…"
                emptyText="Aucun statut."
              />
              <CityFilter cities={cityList} selected={villeSel} onChange={setVilleSel} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold text-[#332151]">
                    <ArrowUpDown className="h-3.5 w-3.5" /> Trier
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[210px]">
                  <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={sort.key} onValueChange={(k) => setSort((s) => ({ ...s, key: k as typeof s.key }))}>
                    <DropdownMenuRadioItem value="scheduled_at">Date d&apos;envoi</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="centre">Centre</DropdownMenuRadioItem>
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

            {/* Table — same design as the Centres page */}
            <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden p-4 sm:p-5">
              <DataTable<Reminder>
                data={sortedItems}
                getRowId={(r) => r.id}
                minWidth="900px"
                hideToolbar
                bare
                onRowClick={(r) => { const c = centreByDossier.get(r.dossier_id); if (c?.id) onOpenDossier?.(c.id); }}
                onRowHover={(r) => { const c = centreByDossier.get(r.dossier_id); if (c?.id) void getDetail(c.id).catch(() => {}); }}
                emptyMessage="Aucun rappel ne correspond à vos filtres."
                columns={[
                  {
                    id: "centre",
                    header: "Centre",
                    width: "minmax(200px,1.6fr)",
                    cell: (r) => {
                      const c = centreByDossier.get(r.dossier_id);
                      return <CentreCell name={c?.enseigne ?? c?.code_centre ?? "Dossier"} code={c?.code_centre} />;
                    },
                  },
                  {
                    id: "ville",
                    header: "Ville",
                    width: "minmax(120px,1fr)",
                    cell: (r) => <VilleCell ville={centreByDossier.get(r.dossier_id)?.ville} />,
                  },
                  {
                    id: "motif",
                    header: "Motif",
                    width: "minmax(200px,1.4fr)",
                    cell: (r) => {
                      const due = dueTypeOf(r.escalation);
                      return (
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#332151]">{reminderReason(r.piece_attendue)}</p>
                          <span className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#5A5A7A]">
                            {KIND_LABEL[r.kind] ?? r.kind}
                            {due && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">{due}</span>}
                          </span>
                        </div>
                      );
                    },
                  },
                  {
                    id: "statut",
                    header: "Statut",
                    width: "150px",
                    cell: (r) => (
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {statusLabel(r.status)}
                      </span>
                    ),
                  },
                  {
                    id: "date",
                    header: "Date d'envoi",
                    width: "170px",
                    cell: (r) => <span className="text-xs text-[#5A5A7A]">{fmtDate(r.scheduled_at)}</span>,
                  },
                  {
                    id: "actions",
                    header: "Actions",
                    width: "140px",
                    align: "center",
                    cell: (r) => (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); edit(r); }}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#332151]"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {r.status === "pending" && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setConfirmAction({ reminder: r, kind: "stop" }); }}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                            title="Arrêter"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setConfirmAction({ reminder: r, kind: "delete" }); }}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Create Reminder Centered Modal Dialog */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 text-[#1A1A1A] shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-extrabold font-serif-mct text-[#332151] flex items-center gap-2">
                  <Plus className="h-5 w-5 text-[#E34F2D]" />
                  {editingId ? "Modifier le rappel" : "Créer un rappel"}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-[#5A5A7A] hover:text-[#332151] cursor-pointer transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={submit} className="space-y-4">
                {/* Centre — shared single-select combobox (same control as the Centres filter). */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                    Centre concerné
                  </label>
                  <SingleSelect
                    value={form.dossier_id}
                    onChange={(v) => setForm((f) => ({ ...f, dossier_id: v, piece: "" }))}
                    options={dossierOptions}
                    placeholder="Choisir un centre"
                    searchPlaceholder="Rechercher un centre…"
                    className="w-full"
                    fullWidth
                  />
                </div>

                {/* Document — the selected centre's expected pièces (full width). */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                    Document à demander
                  </label>
                  <SingleSelect
                    value={form.piece}
                    onChange={(v) => setForm((f) => ({ ...f, piece: v }))}
                    options={[{ value: "", label: "Tous les documents (récapitulatif)" }, ...pieceOptions]}
                    placeholder={form.dossier_id ? "Choisir un document" : "Choisissez d'abord un centre"}
                    searchPlaceholder="Rechercher un document…"
                    className="w-full"
                    fullWidth
                  />
                </div>

                {/* Date heure picker (full width) */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                    Date et heure
                  </label>
                  <DateTimePicker
                    value={form.scheduled_at ? new Date(form.scheduled_at) : undefined}
                    onChange={(d) => setForm((f) => ({ ...f, scheduled_at: d.toISOString() }))}
                    fromDate={new Date()}
                    placeholder="Choisir date et heure"
                  />
                </div>

                {/* Message textarea */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                    Message (optionnel)
                  </label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Merci d'envoyer votre Kbis..."
                    className="w-full rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-[#E34F2D] focus:bg-white transition-all shadow-sm resize-none"
                  />
                </div>

                {/* Modal actions footer */}
                <div className="pt-4 flex gap-3 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 text-xs font-extrabold rounded-xl border border-slate-200 text-[#5A5A7A] hover:bg-slate-50 transition-colors cursor-pointer text-center"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!form.dossier_id || !form.scheduled_at}
                    className="flex-1 py-3 text-xs font-extrabold rounded-xl bg-[#E34F2D] hover:bg-[#DF3714] disabled:opacity-50 text-white transition-colors cursor-pointer shadow-[0_4px_12px_rgba(234,91,45,0.2)]"
                  >
                    {editingId ? "Enregistrer" : "Créer le rappel"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Destructive-action confirmation — icon AlertDialog (delete + stop). */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent className="max-w-md rounded-3xl border-slate-100">
          {(() => {
            const isDelete = confirmAction?.kind === "delete";
            const Icon = isDelete ? Trash2 : XCircle;
            return (
              <>
                <AlertDialogHeader className="mb-2 items-center gap-3 sm:flex-row sm:items-start sm:gap-4">
                  <span
                    aria-hidden="true"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isDelete ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <AlertDialogTitle className="font-serif-mct text-lg font-extrabold text-[#332151]">
                      {isDelete ? "Supprimer cette relance ?" : "Arrêter cette relance ?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs leading-relaxed text-[#5A5A7A]">
                      {isDelete
                        ? "La relance sera définitivement supprimée. Cette action est irréversible."
                        : "La relance programmée ne sera plus envoyée. Vous pourrez en créer une nouvelle si besoin."}
                    </AlertDialogDescription>
                  </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    className={`${buttonVariants({ variant: isDelete ? "destructive" : "default" })} rounded-xl`}
                    onClick={() => {
                      if (!confirmAction) return;
                      if (confirmAction.kind === "delete") del(confirmAction.reminder.id);
                      else stop(confirmAction.reminder.id);
                    }}
                  >
                    {isDelete ? "Supprimer" : "Arrêter"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            );
          })()}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
