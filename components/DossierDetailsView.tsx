"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Send,
  Zap,
  ChevronRight,
  ChevronDown,
  Check,
  Upload,
  Trash2,
  Pencil,
  AlertTriangle,
  Building2,
  Paperclip,
  Loader2
} from "lucide-react";

import { type Message, type DossierDetail, centreDetailToDossier } from "./dossier-details/dossierData";
import PipelineBoards, { microNext, microPrev, microToMacro, MICRO_STAGES, MICRO_KEYS } from "./dossier-details/PipelineBoards";
import { Timeline, TimelineItem, TimelineDot, TimelineLine, TimelineHeading, TimelineContent } from "@/components/ui/timeline";
import { api } from "@/lib/api";
import { useCentresContext, type CentreDetail as CentreFullDetail } from "@/lib/features/centres";
import { useConversationsContext } from "@/lib/features/conversations";
import { advanceDossierStage } from "@/lib/features/dossiers";
import { useDialog } from "@/components/ui/DialogProvider";
import Markdown from "@/components/ui/Markdown";
import { Button } from "@/components/ui/button";
import { na } from "@/lib/utils";

interface DossierDetailsViewProps {
  /** Centre id — the detail payload (GET /api/centres/:id) is centre-scoped. */
  dossierId: string;
  /** Specific dossier id to focus (from the /dashboard/dossiers/:id route). */
  focusDossierId?: string;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
  onSwitch?: (centreId: string) => void;
}

// A labelled field used in the (full-width) centre information card.
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className="mb-1 block text-[9px] font-extrabold uppercase tracking-widest text-slate-400">{label}</span>
      <div className="text-sm font-semibold text-[#2D2A56]">{children}</div>
    </div>
  );
}

export default function DossierDetailsView({ dossierId, focusDossierId, onClose, onNavigateToTab, onSwitch }: DossierDetailsViewProps) {
  // Keep the shared centres cache in sync on edit/delete/upload (re-pulls from backend).
  const { remove: removeCentre, update: updateCentre, upload: uploadDoc, centres, ensureList, revalidateList } = useCentresContext();
  // WhatsApp chat: send a message / document through the real pipeline (Léo replies).
  const { upload: uploadWhatsappDoc, send: sendWhatsappMessage } = useConversationsContext();
  const { prompt, confirm } = useDialog();
  // Local active dossier state
  const [dossier, setDossier] = useState<DossierDetail | null>(null);
  // Full backend payload (GET /api/centres/:id) — holds dossiers (micro+macro+nav) and alerts.
  const [raw, setRaw] = useState<CentreFullDetail | null>(null);
  const [whatsAppInput, setWhatsAppInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [chatUploading, setChatUploading] = useState(false);
  const [chatTyping, setChatTyping] = useState(false);
  const chatFileRef = useRef<HTMLInputElement>(null);
  // WhatsApp feed: auto-scroll the chat box (not the page) to the latest message.
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  // Macro view: kanban board by default, toggle to the static table.
  const [macroView, setMacroView] = useState<"kanban" | "tableau">("kanban");

  // Centre-switcher needs the full list (the dashboard layout loads it, but be defensive).
  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);

  // Load the real centre detail (id = centre id) — keep BOTH the mapped view and the raw payload.
  const load = useCallback(() => {
    return api
      .get(`centres/${dossierId}`)
      .then((d) => {
        setRaw(d as CentreFullDetail);
        setDossier(centreDetailToDossier(d as Parameters<typeof centreDetailToDossier>[0]));
      })
      .catch(() => { setRaw(null); setDossier(null); });
  }, [dossierId]);
  useEffect(() => {
    load();
  }, [load]);

  // Keep the WhatsApp feed pinned to the latest message — scroll the chat box only (not the page).
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dossier?.messages.length, chatUploading, chatTyping]);

  // Close the centre-switcher dropdown on outside click.
  useEffect(() => {
    if (!switcherOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".centre-switcher")) setSwitcherOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [switcherOpen]);

  // The focused dossier (from the route id) carries the micro stage + derived macro + nav
  // hints; fall back to the most recent dossier when no specific id is requested.
  const activeDossier = raw?.dossiers?.length
    ? (focusDossierId ? raw.dossiers.find((d) => d.id === focusDossierId) ?? raw.dossiers[raw.dossiers.length - 1] : raw.dossiers[raw.dossiers.length - 1])
    : null;
  const openAlerts = (raw?.alerts ?? []).filter((a) => a.status === "open");

  // Advance/revert the dossier to an ADJACENT stage. Optimistic: move the card instantly,
  // then reconcile with the backend (no flicker waiting on the round-trip).
  const handleMoveStage = async (target: string) => {
    if (!activeDossier) return;
    const dossierUuid = activeDossier.id;
    const prevRaw = raw;
    // Optimistically patch the active dossier's micro stage + derived macro + nav hints.
    setRaw((r) =>
      r
        ? {
            ...r,
            dossiers: r.dossiers.map((d) =>
              d.id === dossierUuid
                ? { ...d, etape_pipeline: target, statut_ouverture: microToMacro(target), next_stage: microNext(target), prev_stage: microPrev(target) }
                : d,
            ),
          }
        : r,
    );
    try {
      await advanceDossierStage(dossierUuid, { target });
      void load(); // reconcile in the background (same values → no visible change)
      void revalidateList(); // macro status on the centres list changes too
      triggerToast("Étape du dossier mise à jour.");
    } catch {
      setRaw(prevRaw); // revert on failure
      triggerToast("Transition non autorisée.");
    }
  };

  // Resolve an open operator alert for this centre.
  const handleResolveAlert = async (id: string) => {
    try {
      await api.post(`alerts/${id}/resolve`);
      await load();
      triggerToast("Alerte résolue.");
    } catch {
      triggerToast("Échec de la résolution de l'alerte.");
    }
  };

  // WhatsApp composer: attach a document → runs the client-document pipeline (OCR/classify),
  // then refreshes the dossier (new message + pieces checklist).
  const onChatFilePicked = async (file: File) => {
    setChatUploading(true);
    triggerToast(`Envoi de « ${file.name} »…`);
    try {
      await uploadWhatsappDoc(dossierId, file);
      await load();
      triggerToast("Document envoyé et analysé.");
    } catch {
      triggerToast("Échec de l'envoi du document.");
    } finally {
      setChatUploading(false);
    }
  };

  // Operator upload for a (missing) document type → POST /api/centres/:id/documents → refresh.
  const uploadRef = useRef<{ type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickFileFor = (type: string) => {
    uploadRef.current = { type };
    fileInputRef.current?.click();
  };
  const onFilePicked = async (file: File) => {
    const type = uploadRef.current?.type ?? "autre";
    setToastMessage(`Téléversement de « ${type} »…`);
    try {
      await uploadDoc(dossierId, file, type); // context re-pulls detail + list slice
      setToastMessage(`Document « ${type} » téléversé.`);
      load();
    } catch {
      setToastMessage("Échec du téléversement.");
    }
  };

  // Toast trigger
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Edit the centre (enseigne / ville).
  const handleEditCentre = async () => {
    const res = await prompt({
      title: "Modifier le centre",
      submitLabel: "Enregistrer",
      fields: [
        { name: "enseigne", label: "Enseigne", defaultValue: dossier?.centre ?? "", placeholder: "Enseigne du centre" },
        { name: "ville", label: "Ville", defaultValue: dossier?.ville ?? "", placeholder: "Ville" },
      ],
    });
    if (!res) return;
    try {
      await updateCentre(dossierId, { enseigne: res.enseigne, ville: res.ville }); // re-pulls list + detail from backend
      triggerToast("Centre mis à jour.");
      load();
    } catch {
      triggerToast("Échec de la mise à jour.");
    }
  };

  // Delete the centre (and all its data) — context drops it from the cached list.
  const handleDeleteCentre = async () => {
    const ok = await confirm({
      title: "Supprimer ce centre ?",
      message: "Le centre et toutes ses données (dossiers, pièces, messages…) seront définitivement supprimés. Cette action est irréversible.",
      confirmLabel: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    try {
      await removeCentre(dossierId);
      onClose();
    } catch {
      triggerToast("Échec de la suppression.");
    }
  };

  // WhatsApp send simulator
  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = whatsAppInput.trim();
    if (!text || !dossier) return;

    // Optimistically show the message, then run it through the real inbound pipeline.
    const baseCount = dossier.messages.length; // backend messages currently shown
    const newMsg: Message = { sender: "Client", text, time: "À l'instant", type: "user" };
    setDossier((prev) => (prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev));
    setWhatsAppInput("");
    setChatTyping(true);

    try {
      await sendWhatsappMessage(dossierId, text); // → /api/simulate/whatsapp/message (Léo replies async)

      // Léo answers via the inbound worker (intent + RAG can take a few seconds). Poll the
      // detail until the client message + Léo's reply are persisted, then sync the feed.
      let attempt = 0;
      const poll = async () => {
        attempt += 1;
        try {
          const d = (await api.get(`centres/${dossierId}`)) as CentreFullDetail;
          const msgs = (d.messages ?? []) as { sender: string }[];
          if (msgs.length > baseCount) {
            // Backend caught up (client persisted, maybe + reply) → sync, keep nothing stale.
            setRaw(d);
            setDossier(centreDetailToDossier(d as Parameters<typeof centreDetailToDossier>[0]));
          }
          // Stop once Léo's reply landed (client + reply = +2) or after enough tries.
          if (msgs.length >= baseCount + 2 || attempt >= 8) {
            setChatTyping(false);
            return;
          }
        } catch {
          if (attempt >= 8) { setChatTyping(false); return; }
        }
        setTimeout(poll, 2000);
      };
      setTimeout(poll, 1500);
    } catch (err) {
      setChatTyping(false);
      // Roll back the optimistic message and surface the real reason.
      setDossier((prev) => (prev ? { ...prev, messages: prev.messages.filter((m) => m !== newMsg) } : prev));
      const msg = err instanceof Error ? err.message : "";
      triggerToast(/contact phone|téléphone/i.test(msg) ? "Ce centre n'a pas de numéro de contact." : "Échec de l'envoi du message.");
    }
  };

  // Toggle document validation status interactively
  const toggleDocStatus = (docType: "kbis" | "assurance" | "identite") => {
    if (!dossier) return;

    const currentStatus = dossier.documents[docType];
    let nextStatus: "validé" | "manquant" | "en_cours" = "validé";
    if (currentStatus === "validé") nextStatus = "manquant";
    else if (currentStatus === "manquant") nextStatus = "en_cours";

    const updatedDocs = {
      ...dossier.documents,
      [docType]: nextStatus
    };

    // Calculate completeness
    const docValues = Object.values(updatedDocs);
    const validatedCount = docValues.filter(v => v === "validé").length;
    const completeness = Math.round((validatedCount / 3) * 100);

    const updatedDossier: DossierDetail = {
      ...dossier,
      documents: updatedDocs,
      completude: completeness
    };

    setDossier(updatedDossier);
    triggerToast(`Statut du document '${docType.toUpperCase()}' mis à jour.`);
  };

  if (!dossier) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F5F7]">
        <div className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">
          Chargement du dossier...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F5F7]">
      {/* Toast popup */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="dossier-details-toast"
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-[#2D2A56] text-white px-4 py-3.5 rounded-xl shadow-xl border border-white/10 text-xs font-bold"
          >
            <Zap className="h-4.5 w-4.5 text-[#EA5B2D]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern, extremely spacious and clean top bar header */}
      <header className="px-4 sm:px-6 py-4 bg-white border-b border-slate-100 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#2D2A56] transition-colors cursor-pointer shrink-0"
            title="Retour à la liste"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold font-serif-mct text-[#2D2A56] tracking-tight leading-tight">
              {dossier.code ?? dossier.id}
            </h2>
            <p className="truncate text-xs text-[#5A5A7A] mt-0.5">
              {dossier.centre} — {dossier.ville}
            </p>
          </div>
        </div>

        {/* Centre switcher — jump to another centre's dossier without leaving the hub */}
        <div className="relative centre-switcher w-full md:w-[280px] shrink-0">
          <button
            type="button"
            onClick={() => setSwitcherOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200/60 px-4 py-2.5 text-xs font-bold text-[#2D2A56] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 text-[#EA5B2D] shrink-0" />
              <span className="truncate">{dossier.code ?? dossier.id} — {dossier.centre}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${switcherOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {switcherOpen && (
              <motion.div
                key="centre-switcher-menu"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-30 top-full mt-2 left-0 right-0 max-h-[320px] overflow-y-auto custom-scrollbar bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5"
              >
                {centres.map((c) => {
                  const active = c.id === dossierId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSwitcherOpen(false); if (!active) onSwitch?.(c.id); }}
                      className={`w-full text-left px-3 py-2.5 text-[11px] font-bold transition-all cursor-pointer rounded-lg mb-0.5 last:mb-0 flex items-center justify-between gap-2 ${
                        active ? "bg-[#EA5B2D]/10 text-[#EA5B2D]" : "text-slate-600 hover:bg-slate-50 hover:text-[#2D2A56]"
                      }`}
                    >
                      <span className="truncate">{c.code_centre} — {c.enseigne ?? c.ville ?? "—"}</span>
                      {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })}
                {centres.length === 0 && (
                  <p className="px-3 py-2.5 text-[11px] font-semibold italic text-slate-400">Aucun centre.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Spacious, premium and high-end details layout */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto w-full min-w-0 custom-scrollbar bg-[#F5F5F7]">
        {/* ALERTS — open operator alerts for this dossier/centre */}
        {openAlerts.length > 0 && (
          <div className="max-w-[1400px] mx-auto mb-6 rounded-3xl border border-red-200/70 bg-red-50/50 p-4 sm:p-5 shadow-[0_8px_30px_rgba(244,63,94,0.04)]">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
                {openAlerts.length} alerte{openAlerts.length > 1 ? "s" : ""} active{openAlerts.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {openAlerts.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 rounded-2xl border border-red-100 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <span className="inline-block text-[8.5px] font-extrabold uppercase tracking-wider text-red-500 mb-1">{a.type}</span>
                    <p className="text-xs font-semibold text-[#2D2A56] leading-relaxed break-words">{a.message}</p>
                  </div>
                  <button
                    onClick={() => handleResolveAlert(a.id)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-700 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all cursor-pointer"
                  >
                    <Check className="h-3 w-3" /> Résoudre
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pb-8">

          {/* FICHE DU CENTRE — full-width info card with inline edit/delete */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Building2 className="h-4 w-4 shrink-0 text-[#EA5B2D]" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#5A5A7A]">Fiche du centre</span>
                <span className="rounded-md bg-[#EA5B2D]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#EA5B2D]">Partenaire MCT</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={handleEditCentre} title="Modifier le centre" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-[#2D2A56]">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={handleDeleteCentre} title="Supprimer le centre" className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-rose-500 hover:bg-rose-500 hover:text-white">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-6 md:grid-cols-3 xl:grid-cols-4">
              <Field label="Code centre"><span className="font-mono">{dossier.code ?? dossier.id}</span></Field>
              <Field label="Enseigne">{na(dossier.centre)}</Field>
              <Field label="Ville">{na(dossier.ville)}</Field>
              <Field label="Dénomination">{na(dossier.denomination)}</Field>
              <Field label="Gérant"><span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" />{na(dossier.gerant)}</span></Field>
              <Field label="Téléphone"><span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" />{na(dossier.contact)}</span></Field>
              <Field label="Email"><span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" /><span className="truncate">{na(dossier.email)}</span></span></Field>
              <Field label="SIRET"><span className="font-mono">{na(dossier.siret)}</span></Field>
              <Field label="Date signature"><span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" />{na(dossier.signatureDate)}</span></Field>
              <Field label="Ouverture prévue">{na(dossier.ouvertureDate)}</Field>
              <Field label="Adresse" className="col-span-2">
                <span className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" /><span>{na(dossier.adresse)}</span></span>
              </Field>
            </div>

            {/* Footer CTA */}
            <div className="flex justify-end border-t border-slate-100 px-6 py-3">
              <button
                onClick={() => onNavigateToTab?.("Carte")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#EA5B2D]/10 px-3.5 py-2 text-xs font-bold text-[#EA5B2D] transition-colors hover:bg-[#EA5B2D] hover:text-white cursor-pointer"
              >
                <MapPin className="h-3.5 w-3.5" /> Voir sur la carte MCT <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* LEFT COLUMN: Parcours timeline (aligns with the WhatsApp feed) */}
          <div className="lg:col-span-1 space-y-8">

            {/* PARCOURS — pipeline progression */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100">
              <span className="mb-4 block border-b border-slate-100 pb-3 text-[10px] font-extrabold uppercase tracking-widest text-[#5A5A7A]">
                Parcours du dossier
              </span>
              {(() => {
                const microIdx = activeDossier?.etape_pipeline ? MICRO_KEYS.indexOf(activeDossier.etape_pipeline) : -1;
                const isBlocked = activeDossier?.statut_ouverture === "bloque";
                return (
                  <Timeline positions="left">
                    {MICRO_STAGES.map((s, i) => {
                      const done = microIdx >= 0 && i < microIdx;
                      const current = i === microIdx;
                      const status = current ? (isBlocked ? "error" : "current") : done ? "done" : "default";
                      const last = i === MICRO_STAGES.length - 1;
                      return (
                        <TimelineItem key={s.key} status={done ? "done" : "default"}>
                          <TimelineHeading variant="primary">{s.label}</TimelineHeading>
                          <TimelineDot status={status} />
                          {!last && <TimelineLine done={done} />}
                          <TimelineContent>
                            <span className="text-[11px] font-semibold">
                              {current ? (isBlocked ? "Bloqué à cette étape" : "En cours") : done ? "Terminé" : "À venir"}
                            </span>
                          </TimelineContent>
                        </TimelineItem>
                      );
                    })}
                  </Timeline>
                );
              })()}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFilePicked(f);
                e.target.value = "";
              }}
            />

          </div>

          {/* RIGHT COLUMN: WhatsApp Chat Feed (Span 2) */}
          <div className="lg:col-span-2 space-y-8">

            {/* WHATSAPP FEED & CHAT INPUT */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px] max-h-[640px] transition-all duration-300">
              
              {/* WhatsApp Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-[#2D2A56]">{dossier.code ?? dossier.id}</h4>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Actif
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">WhatsApp</span>
              </div>

              {/* Scroll Messages feed area */}
              <div ref={messagesScrollRef} className="flex-1 p-5 overflow-y-auto space-y-2.5 bg-slate-50/60 custom-scrollbar">
                {dossier.messages.map((msg, idx) => {
                  const outgoing = msg.type === "ai" || msg.type === "operator";
                  return (
                    <div key={idx} className={`flex ${outgoing ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                          outgoing
                            ? "bg-[#E7F7E3] text-[#1B3329] rounded-br-sm"
                            : "bg-white border border-slate-200 text-[#2D2A56] rounded-bl-sm"
                        }`}
                      >
                        {msg.type === "ai" && (
                          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-[#EA5B2D]">
                            Léo
                            <span className="rounded bg-[#EA5B2D]/10 px-1 py-px text-[8px] font-extrabold uppercase tracking-wider">IA</span>
                          </span>
                        )}
                        {msg.type === "ai" ? (
                          <Markdown>{msg.text}</Markdown>
                        ) : (
                          <p className="whitespace-pre-line font-medium">{msg.text}</p>
                        )}
                        <span className={`mt-1 block text-right text-[9px] font-semibold ${outgoing ? "text-emerald-700/50" : "text-slate-400"}`}>
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Léo "typing / thinking" indicator */}
                {chatTyping && (
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-br-sm bg-[#E7F7E3] px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600/60 animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600/60 animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600/60 animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Composer area */}
              <form
                onSubmit={handleSendWhatsApp}
                className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
              >
                {/* Attach a document (client document pipeline) */}
                <input
                  ref={chatFileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onChatFilePicked(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => chatFileRef.current?.click()}
                  disabled={chatUploading}
                  title="Joindre un document"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-[#EA5B2D] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {chatUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                </button>
                <input
                  type="text"
                  value={whatsAppInput}
                  onChange={(e) => setWhatsAppInput(e.target.value)}
                  placeholder="Écrire un message (l'IA Léo répond)…"
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#2D2A56] placeholder-slate-400 outline-none focus:border-[#EA5B2D] focus:bg-white transition-colors font-medium"
                />
                <button
                  type="submit"
                  disabled={!whatsAppInput.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EA5B2D] text-white hover:bg-[#d24e24] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>

            </div>

          </div>

          {/* PIPELINE — micro (draggable) + macro (grouped, read-only), unified component */}
          <PipelineBoards
            etape={activeDossier?.etape_pipeline}
            statut={activeDossier?.statut_ouverture}
            nextStage={activeDossier?.next_stage}
            prevStage={activeDossier?.prev_stage}
            code={dossier.code ?? dossier.id}
            centre={dossier.centre}
            onMove={handleMoveStage}
          />

          {/* DOCUMENTS CHECKLIST — full-width row below the columns */}
          <div className="lg:col-span-3 bg-white p-7 rounded-3xl border border-slate-100 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5A5A7A]">Documents Pièces</span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Checklist Live</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {(dossier.presentPieces ?? []).map((p, i) => (
                <div key={`p-${i}-${p}`} className="flex items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-bold text-[#2D2A56] min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3" /></span>
                    <span className="truncate">{p}</span>
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 shrink-0">Reçu</span>
                </div>
              ))}
              {(dossier.missingPieces ?? []).map((p, i) => (
                <div key={`m-${i}-${p}`} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-500 min-w-0">
                    <span className="h-5 w-5 shrink-0 rounded-full border-2 border-dashed border-slate-300" />
                    <span className="truncate">{p}</span>
                  </span>
                  <button
                    onClick={() => pickFileFor(p)}
                    title={`Téléverser « ${p} »`}
                    className="group/up flex items-center gap-1.5 shrink-0 rounded-full border border-[#EA5B2D]/25 bg-[#EA5B2D]/5 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#EA5B2D] hover:bg-[#EA5B2D] hover:text-white hover:border-[#EA5B2D] transition-all duration-200 cursor-pointer"
                  >
                    <Upload className="h-3 w-3 transition-transform group-hover/up:-translate-y-0.5" />
                    <span>Téléverser</span>
                  </button>
                </div>
              ))}
              {(dossier.presentPieces ?? []).length === 0 && (dossier.missingPieces ?? []).length === 0 && (
                <p className="text-xs font-semibold italic text-slate-400 sm:col-span-2 xl:col-span-3">Aucune pièce attendue.</p>
              )}
            </div>
            <div className="mt-4 flex justify-end border-t border-slate-100/60 pt-3">
              <button
                onClick={() => onNavigateToTab?.("Validations")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#EA5B2D]/10 px-3.5 py-2 text-xs font-bold text-[#EA5B2D] transition-colors hover:bg-[#EA5B2D] hover:text-white cursor-pointer"
              >
                Vérifier dans Validations <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
