"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Menu, Bell, XCircle, Trash2, Pencil, Plus, X, ChevronDown, Search, Building2, Calendar, Send, FileText, Repeat, ArrowRight, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRemindersContext, type Reminder } from "@/lib/features/reminders";
import { useDossiersContext } from "@/lib/features/dossiers";
import { useDialog } from "@/components/ui/DialogProvider";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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

// Left-edge stripe colour, mirrors the status tone.
const STATUS_STRIPE: Record<string, string> = {
  pending: "bg-amber-500",
  sent: "bg-emerald-500",
  cancelled: "bg-slate-300",
  escalated: "bg-rose-500",
  cancelled_by_client_reply: "bg-slate-300",
};

const KIND_LABEL: Record<string, string> = { auto: "Automatique", manual: "Manuel" };

const statusLabel = (s: string) => STATUS_LABEL[s] ?? s;
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

// A small labelled value used in the reminder cards.
function Field({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="flex items-center gap-1 text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">
        <span className="text-slate-300">{icon}</span>
        {label}
      </span>
      <span className="block text-[11.5px] font-bold text-[#332151] truncate">{value}</span>
    </div>
  );
}

// ISO datetime → the value a <input type="datetime-local"> expects.
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const { prompt } = useDialog();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ dossier_id: "", piece: "", message: "", scheduled_at: "" });
  // Reminder pending a destructive/irreversible action — drives the confirm AlertDialog.
  const [confirmAction, setConfirmAction] = useState<{ reminder: Reminder; kind: "delete" | "stop" } | null>(null);

  const closeModal = () => {
    setShowCreate(false);
    setEditingId(null);
    setForm({ dossier_id: "", piece: "", message: "", scheduled_at: "" });
    setDossierSearchQuery("");
  };

  // Custom select dropdown state inside the modal
  const [isDossierDropdownOpen, setIsDossierDropdownOpen] = useState(false);
  const [dossierSearchQuery, setDossierSearchQuery] = useState("");

  // Cache-guarded loads via the shared contexts.
  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
  useEffect(() => { ensureDossiers(); }, [ensureDossiers]);

  // Resolve a reminder's dossier_id (UUID) → its centre, so cards show names not ids.
  const centreByDossier = useMemo(() => {
    const m = new Map<string, NonNullable<(typeof dossiers)[number]["centre"]>>();
    for (const d of dossiers) if (d.centre) m.set(d.id, d.centre);
    return m;
  }, [dossiers]);

  // Close custom dropdown on outside click
  useEffect(() => {
    if (!isDossierDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".dossier-dropdown-container")) {
        setIsDossierDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isDossierDropdownOpen]);

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

  // Find currently selected dossier object for displaying label in selector
  const selectedDossier = dossiers.find((d) => d.id === form.dossier_id);
  const selectedDossierLabel = selectedDossier
    ? `${selectedDossier.centre?.enseigne ?? selectedDossier.centre?.code_centre ?? "—"} · ${selectedDossier.etape_pipeline}`
    : "— Choisir un dossier / centre —";

  // Filter dossiers list by search query
  const filteredDossiers = dossiers.filter((d) => {
    const term = `${d.centre?.enseigne ?? ""} ${d.centre?.code_centre ?? ""} ${d.etape_pipeline}`.toLowerCase();
    return term.includes(dossierSearchQuery.toLowerCase());
  });

  return (
    <>
      <header className="border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur lg:px-6">
        <div className="mb-2 flex items-center justify-between md:hidden">
          <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
          <button onClick={() => setMobileMenuOpen?.(true)} className="rounded-lg p-2 text-[#332151] hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-serif-mct text-xl font-bold text-[#332151]">Rappels</h1>
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
          <div className="max-w-[1400px] mx-auto rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden p-4 sm:p-5">
            <DataTable<Reminder>
              data={items}
              getRowId={(r) => r.id}
              minWidth="820px"
              hideToolbar
              bare
              onRowClick={(r) => { const centre = centreByDossier.get(r.dossier_id); if (centre?.id) onOpenDossier?.(centre.id); }}
              rowClassName={(r) => (centreByDossier.get(r.dossier_id)?.id ? "cursor-pointer" : "cursor-default")}
              columns={[
                {
                  id: "centre",
                  header: "Centre",
                  width: "minmax(220px,1.4fr)",
                  cell: (r) => {
                    const centre = centreByDossier.get(r.dossier_id);
                    const centreName = centre?.enseigne ?? centre?.code_centre ?? "Dossier";
                    return (
                      <div className="min-w-0">
                        {centre?.code_centre && (
                          <span className="font-mono text-[10.5px] font-bold text-[#332151]">{centre.code_centre}</span>
                        )}
                        <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[#332151]">
                          <Building2 className="h-3.5 w-3.5 text-[#E34F2D] shrink-0" />
                          <span className="truncate">{centreName}</span>
                        </p>
                        {centre?.ville && <p className="text-[11px] font-semibold text-slate-400">{centre.ville}</p>}
                      </div>
                    );
                  },
                },
                {
                  id: "details",
                  header: "Détails",
                  width: "minmax(200px,1.4fr)",
                  cell: (r) => (
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-[#5A5A7A]">{KIND_LABEL[r.kind] ?? r.kind}</span>
                        {r.escalation > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#E34F2D]/10 px-2 py-0.5 text-[10px] font-semibold text-[#E34F2D]">
                            <Repeat className="h-2.5 w-2.5" /> Relance n°{r.escalation}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">{r.piece_attendue ?? "Digest (toutes pièces)"}</p>
                    </div>
                  ),
                },
                {
                  id: "scheduled",
                  header: "Programmé le",
                  width: "150px",
                  cell: (r) => (
                    <span className="whitespace-nowrap text-[11px] font-bold text-[#332151]">{fmtDate(r.scheduled_at)}</span>
                  ),
                },
                {
                  id: "statut",
                  header: "Statut",
                  width: "130px",
                  cell: (r) => {
                    const tone = STATUS_TONE[r.status] ?? "bg-slate-500 text-white";
                    return (
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{statusLabel(r.status)}</span>
                    );
                  },
                },
                {
                  id: "actions",
                  header: "Actions",
                  width: "170px",
                  align: "right",
                  cell: (r) => {
                    const centre = centreByDossier.get(r.dossier_id);
                    return (
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {centre?.id && (
                          <Button size="sm" variant="outline" onClick={() => onOpenDossier?.(centre.id)} title="Ouvrir le dossier" className="gap-1.5 text-[11px] font-bold text-[#332151]">
                            Ouvrir <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#5A5A7A]"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[190px]">
                            {r.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => edit(r)}><Pencil /> Modifier</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setConfirmAction({ reminder: r, kind: "stop" })}><XCircle /> Arrêter</DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem onClick={() => setConfirmAction({ reminder: r, kind: "delete" })} className="text-red-600 focus:bg-red-50"><Trash2 /> Supprimer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  },
                },
              ]}
            />
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
                {/* Centre / dossier Custom Searchable Dropdown */}
                <div className="relative dossier-dropdown-container">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                    Centre / dossier
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDossierDropdownOpen(!isDossierDropdownOpen)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-3 text-xs font-bold text-slate-800 outline-none flex items-center justify-between cursor-pointer hover:bg-slate-100/50 hover:border-slate-300 transition-all shadow-sm"
                  >
                    <span className="truncate">{selectedDossierLabel}</span>
                    <ChevronDown
                      className={`h-4.5 w-4.5 text-[#332151] transition-transform duration-200 shrink-0 ${
                        isDossierDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isDossierDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-50 top-full mt-2 left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 flex flex-col max-h-[300px]"
                      >
                        {/* Search Input */}
                        <div className="relative mb-2 shrink-0">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Rechercher un dossier/centre..."
                            value={dossierSearchQuery}
                            onChange={(e) => setDossierSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-[#E34F2D] focus:bg-white transition-all uppercase tracking-wider"
                          />
                        </div>

                        {/* List Items */}
                        <div className="flex-1 overflow-y-auto max-h-48 custom-scrollbar space-y-0.5 pr-1">
                          {filteredDossiers.map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                setForm((f) => ({ ...f, dossier_id: d.id }));
                                setIsDossierDropdownOpen(false);
                                setDossierSearchQuery("");
                              }}
                              className={`w-full text-left px-3 py-2.5 text-xs font-bold transition-all cursor-pointer rounded-xl flex flex-col gap-0.5 ${
                                form.dossier_id === d.id
                                  ? "bg-[#E34F2D] text-white shadow-sm"
                                  : "text-slate-700 hover:bg-slate-50 hover:text-[#E34F2D]"
                              }`}
                            >
                              <span className="truncate">
                                {d.centre?.enseigne ?? d.centre?.code_centre ?? "—"}
                              </span>
                              <span
                                className={`text-[9px] uppercase tracking-wider ${
                                  form.dossier_id === d.id ? "text-white/80" : "text-slate-400"
                                }`}
                              >
                                {d.etape_pipeline}
                              </span>
                            </button>
                          ))}
                          {filteredDossiers.length === 0 && (
                            <div className="py-8 text-center text-xs text-slate-400 font-bold">
                              Aucun dossier trouvé
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pièce input */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                      Pièce (vide = digest)
                    </label>
                    <input
                      type="text"
                      value={form.piece}
                      onChange={(e) => setForm((f) => ({ ...f, piece: e.target.value }))}
                      placeholder="Ex: kbis, assurance..."
                      className="w-full rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-[#E34F2D] focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  {/* Date heure picker */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                      Date / heure
                    </label>
                    <DateTimePicker
                      value={form.scheduled_at ? new Date(form.scheduled_at) : undefined}
                      onChange={(d) => setForm((f) => ({ ...f, scheduled_at: d.toISOString() }))}
                      fromDate={new Date()}
                      placeholder="Choisir date et heure"
                    />
                  </div>
                </div>

                {/* Message textarea */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                    Message (vide = défaut)
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
