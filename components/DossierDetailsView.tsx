"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  ChevronRight,
  ChevronDown,
  Check,
  Upload,
  AlertTriangle,
  Building2,
  Paperclip,
  ExternalLink,
  ShieldCheck,
  Clock,
  BellPlus
} from "lucide-react";

import PipelineBoards from "./dossier-details/PipelineBoards";
import CentreInfoModal from "./dossier-details/CentreInfoModal";
import { Timeline, TimelineItem, TimelineDot, TimelineLine, TimelineHeading, TimelineContent } from "@/components/ui/timeline";
import {
  useCentresContext,
  type CentreDetail as CentreFullDetail,
  type Message,
  type DossierDetail,
  centreDetailToDossier,
} from "@/lib/features/centres";
import { useConversationsContext, awaitInboundReply } from "@/lib/features/conversations";
import { useDossiersContext, microNext, microPrev, microToMacro, MICRO_STAGES, MICRO_KEYS } from "@/lib/features/dossiers";
import { useAlertsContext } from "@/lib/features/alerts";
import { pieceTypeLabel } from "@/lib/features/pieces";
import AddReminderModal from "./dossier-details/AddReminderModal";
import { type SelectOption } from "@/components/ui/Select";
import Markdown from "@/components/ui/Markdown";

interface DossierDetailsViewProps {
  /** Centre id — the detail payload (GET /api/centres/:id) is centre-scoped. */
  dossierId: string;
  /** Specific dossier id to focus (from the /dashboard/dossiers/:id route). */
  focusDossierId?: string;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
  onSwitch?: (centreId: string) => void;
}

export default function DossierDetailsView({ dossierId, focusDossierId, onClose, onNavigateToTab, onSwitch }: DossierDetailsViewProps) {
  // Centre cache: upload re-pulls detail; getDetail serves the cached centre payload.
  const { getDetail, centres, ensureList, revalidateList } = useCentresContext();
  // WhatsApp chat: send a message / document through the real pipeline (Léo replies).
  const { upload: uploadWhatsappDoc, send: sendWhatsappMessage } = useConversationsContext();
  // Pipeline advance/revert goes through the shared dossiers context (feature pattern).
  const { advance: advanceStage } = useDossiersContext();
  // Operator-alert resolution goes through the alerts feature (no direct api calls in views).
  const { resolve: resolveAlert } = useAlertsContext();
  // Schedule-reminder modal (the modal itself talks to the reminders feature).
  const [reminderOpen, setReminderOpen] = useState(false);
  // Local active dossier state
  const [dossier, setDossier] = useState<DossierDetail | null>(null);
  // Full backend payload (GET /api/centres/:id) — holds dossiers (micro+macro+nav) and alerts.
  const [raw, setRaw] = useState<CentreFullDetail | null>(null);
  const [whatsAppInput, setWhatsAppInput] = useState("");
  const [centreInfoOpen, setCentreInfoOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [chatUploading, setChatUploading] = useState(false);
  const [chatTyping, setChatTyping] = useState(false);
  const chatFileRef = useRef<HTMLInputElement>(null);
  // WhatsApp feed: auto-scroll the chat box (not the page) to the latest message.
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  // Which of the centre's files (dossiers) is in focus — taken from the route.
  const focusId = focusDossierId;

  // Centre-switcher needs the full list (the dashboard layout loads it, but be defensive).
  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);

  // Load the real centre detail (id = centre id) via the shared cache — instant on
  // revisit, deduped. Pass force=true to bypass the cache (post-mutation reconcile).
  const load = useCallback((force = false) => {
    return getDetail(dossierId, force)
      .then((d) => {
        setRaw(d);
        setDossier(centreDetailToDossier(d));
      })
      .catch(() => { setRaw(null); setDossier(null); });
  }, [dossierId, getDetail]);
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
    ? (focusId ? raw.dossiers.find((d) => d.id === focusId) ?? raw.dossiers[raw.dossiers.length - 1] : raw.dossiers[raw.dossiers.length - 1])
    : null;
  const openAlerts = (raw?.alerts ?? []).filter((a) => a.status === "open");

  // Received documents with their real metadata (drive link, validation, confidence).
  const receivedPieces = raw?.pieces ?? [];
  const PIECE_LABEL: Record<string, string> = {
    kbis: "KBIS", piece_identite_exploitant: "Pièce d'identité (exploitant)",
    attestation_conformite_logiciel: "Attestation conformité logiciel",
    bail_commercial: "Bail commercial", assurance: "Attestation d'assurance",
    plan_implantation: "Plan d'implantation",
  };
  const pieceLabel = (t: string) =>
    PIECE_LABEL[t] ?? (t ? t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "Document");

  // Advance/revert the dossier to an ADJACENT stage. Optimistic: move the card instantly,
  // then reconcile with the backend (no flicker waiting on the round-trip).
  const handleMoveStage = async (target: string) => {
    if (!activeDossier) return;
    const dossierUuid = activeDossier.id;
    // Move by DIRECTION (next/back) relative to the current stage — the drop target is
    // always an adjacent column, so derive the direction from the canonical order.
    const current = activeDossier.etape_pipeline;
    const direction = target === microNext(current ?? "") ? "next" : target === microPrev(current ?? "") ? "back" : null;
    if (!direction) return; // not an adjacent step — ignore
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
      await advanceStage(dossierUuid, { direction, target });
      void load(true); // reconcile in the background (same values → no visible change)
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
      await resolveAlert(id);
      await load(true);
      triggerToast("Alerte résolue.");
    } catch {
      triggerToast("Échec de la résolution de l'alerte.");
    }
  };

  // WhatsApp composer: attach a document → runs the client-document pipeline (OCR/classify),
  // then refreshes the dossier (new message + pieces checklist).
  const onChatFilePicked = async (file: File) => {
    setChatUploading(true);
    const id = toast.loading(`Envoi de « ${file.name} »…`);
    try {
      await uploadWhatsappDoc(dossierId, file, { poll: false });
      await load(true);
      toast.success("Document envoyé et analysé.", { id });
    } catch {
      toast.error("Échec de l'envoi du document.", { id });
    } finally {
      setChatUploading(false);
    }
  };

  // Operator upload for a (missing) document type. Routes through the WhatsApp client-document
  // pipeline (uploadWhatsappDoc) so the file gets OCR + auto-classification — the direct
  // /centres/:id/documents upload skips OCR, so we deliberately don't use it here.
  const uploadRef = useRef<{ type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickFileFor = (type: string) => {
    uploadRef.current = { type };
    fileInputRef.current?.click();
  };
  const onFilePicked = async (file: File) => {
    const type = uploadRef.current?.type ?? "autre";
    const id = toast.loading(`Téléversement de « ${type} »…`);
    try {
      await uploadWhatsappDoc(dossierId, file, { poll: false }); // WhatsApp pipeline → OCR + classify
      await load(true);
      toast.success(`Document « ${type} » envoyé et analysé.`, { id });
    } catch {
      toast.error("Échec du téléversement.", { id });
    }
  };

  // Route a message to a success or error toast based on its wording.
  const triggerToast = (msg: string) =>
    /échec|non autoris|n'a pas|erreur|bloqu/i.test(msg) ? toast.error(msg) : toast.success(msg);

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
      await sendWhatsappMessage(dossierId, text, { poll: false }); // → /api/simulate/whatsapp/message (Léo replies async)

      // Léo answers via the inbound worker (async). The poll cadence + stop-rule live
      // in the conversations feature; we just supply how to fetch + sync the feed.
      await awaitInboundReply({
        fetchDetail: () => getDetail(dossierId, true), // fresh pull (also refreshes the cache)
        count: (d) => (d.messages ?? []).length,
        baseCount,
        onGrow: (d) => { setRaw(d); setDossier(centreDetailToDossier(d)); },
      });
      setChatTyping(false);
    } catch (err) {
      setChatTyping(false);
      // Roll back the optimistic message and surface the real reason.
      setDossier((prev) => (prev ? { ...prev, messages: prev.messages.filter((m) => m !== newMsg) } : prev));
      const msg = err instanceof Error ? err.message : "";
      triggerToast(/contact phone|téléphone/i.test(msg) ? "Ce centre n'a pas de numéro de contact." : "Échec de l'envoi du message.");
    }
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
      {/* Modern, extremely spacious and clean top bar header */}
      <header className="px-4 sm:px-6 py-4 bg-white border-b border-slate-100 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#332151] transition-colors cursor-pointer shrink-0"
            title="Retour à la liste"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold font-serif-mct text-[#332151] tracking-tight leading-tight">
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
            className="w-full flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200/60 px-4 py-2.5 text-xs font-bold text-[#332151] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 text-[#E34F2D] shrink-0" />
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
                        active ? "bg-[#E34F2D]/10 text-[#E34F2D]" : "text-slate-600 hover:bg-slate-50 hover:text-[#332151]"
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
                    <p className="text-xs font-semibold text-[#332151] leading-relaxed break-words">{a.message}</p>
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

          {/* LEFT COLUMN: centre-details button + pipeline (aligns with the WhatsApp feed) */}
          <div className="lg:col-span-1 space-y-8">

            {/* Centre details (read-only modal) + schedule a reminder for this dossier. */}
            <div className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => setCentreInfoOpen(true)}
                disabled={!raw?.centre}
                aria-label="Voir les détails du centre"
                className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#332151] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#E34F2D] disabled:opacity-50 cursor-pointer"
              >
                <Building2 className="h-4 w-4 shrink-0" /> <span className="truncate">Détails du centre</span>
              </button>
              <button
                type="button"
                onClick={() => setReminderOpen(true)}
                disabled={!activeDossier}
                aria-label="Ajouter un rappel pour ce dossier"
                title="Ajouter un rappel"
                className="flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#332151]/15 bg-white px-4 py-3.5 text-sm font-bold text-[#332151] transition-colors hover:border-[#E34F2D] hover:text-[#E34F2D] disabled:opacity-50 cursor-pointer"
              >
                <BellPlus className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Rappel</span>
              </button>
            </div>

            {/* PARCOURS — single pipeline visualization (vertical timeline + adjacent-step controls) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100">
              <span className="mb-4 block border-b border-slate-100 pb-3 text-[10px] font-extrabold uppercase tracking-widest text-[#5A5A7A]">
                Parcours du dossier
              </span>
              {(() => {
                const microIdx = activeDossier?.etape_pipeline ? MICRO_KEYS.indexOf(activeDossier.etape_pipeline) : -1;
                const isBlocked = activeDossier?.statut_ouverture === "bloque";
                return (
                  <>
                    {microIdx < 0 && !activeDossier?.etape_pipeline && (
                      <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-400">
                        Aucune étape en cours — le dossier n&apos;est pas encore entré dans le pipeline.
                      </p>
                    )}
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
                  </>
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
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px] max-h-[640px] transition-all duration-200">
              
              {/* WhatsApp Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-[#332151]">{dossier.code ?? dossier.id}</h4>
                    {chatTyping && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
                        <span className="flex items-center gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
                        </span>
                        <span translate="no">Léo est en train d&apos;écrire…</span>
                      </span>
                    )}
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
                            : "bg-white border border-slate-200 text-[#332151] rounded-bl-sm"
                        }`}
                      >
                        {msg.type === "ai" && (
                          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-[#E34F2D]">
                            Léo
                            <span className="rounded bg-[#E34F2D]/10 px-1 py-px text-[8px] font-extrabold uppercase tracking-wider">IA</span>
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
                className="relative p-3 border-t border-slate-100 bg-white flex items-center gap-2"
              >
                {/* Upload progress — orange bar sweeping left→right along the bottom border. */}
                {chatUploading && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
                    <motion.div
                      className="h-full w-1/3 rounded-full bg-[#E34F2D]"
                      initial={{ x: "-100%" }}
                      animate={{ x: "300%" }}
                      transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                    />
                  </div>
                )}
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-[#E34F2D] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={whatsAppInput}
                  onChange={(e) => setWhatsAppInput(e.target.value)}
                  placeholder="Écrire un message (l'IA Léo répond)…"
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-[#332151] placeholder-slate-400 outline-none focus:border-[#E34F2D] focus:bg-white transition-colors font-medium"
                />
                <button
                  type="submit"
                  disabled={!whatsAppInput.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E34F2D] text-white hover:bg-[#DF3714] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>

            </div>

          </div>

          {/* PIPELINE — draggable kanban (change the stage by dragging the card to an adjacent column) */}
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
              {receivedPieces.map((p) => {
                const validated = p.valide_par_humain;
                const label = pieceLabel(p.type_piece);
                const meta = validated && p.validated_at
                  ? `Validé le ${new Date(p.validated_at).toLocaleDateString("fr-FR")}`
                  : p.rejet_raison
                  ? `Rejeté · ${p.rejet_raison}`
                  : "À valider";
                return (
                  <div key={p.id} className={`flex flex-col gap-1.5 rounded-xl border px-4 py-2.5 ${validated ? "border-emerald-100 bg-emerald-50/40" : "border-amber-100 bg-amber-50/40"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-bold text-[#332151] min-w-0">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${validated ? "bg-emerald-500" : "bg-amber-500"}`}>
                          {validated ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        </span>
                        <span className="truncate">{label}</span>
                      </span>
                      {p.drive_link && (
                        <a
                          href={p.drive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ouvrir dans le Drive"
                          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-500 hover:border-[#E34F2D] hover:text-[#E34F2D] transition-colors cursor-pointer"
                        >
                          <ExternalLink className="h-3 w-3" /> Drive
                        </a>
                      )}
                    </div>
                    {(p.nom_fichier_origine || p.nom_fichier_canonique) && (
                      <span
                        className="truncate pl-7 font-mono text-[11px] font-medium text-[#5A5A7A]"
                        title={p.nom_fichier_origine ?? p.nom_fichier_canonique ?? ""}
                      >
                        {p.nom_fichier_origine ?? p.nom_fichier_canonique}
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-2 pl-7">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${validated ? "text-emerald-600" : p.rejet_raison ? "text-red-500" : "text-amber-600"}`}>
                        {validated && <ShieldCheck className="h-3 w-3" />}<span>{meta}</span>
                      </span>
                      {typeof p.confiance_classification === "number" && (
                        <span className="shrink-0 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                          IA {Math.round(p.confiance_classification * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {(dossier.missingPieces ?? []).map((p, i) => (
                <div key={`m-${i}-${p}`} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-500 min-w-0">
                    <span className="h-5 w-5 shrink-0 rounded-full border-2 border-dashed border-slate-300" />
                    <span className="truncate">{p}</span>
                  </span>
                  <button
                    onClick={() => pickFileFor(p)}
                    title={`Téléverser « ${p} »`}
                    aria-label={`Téléverser ${p}`}
                    className="group/up flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#E34F2D]/25 bg-[#E34F2D]/5 text-[#E34F2D] hover:bg-[#E34F2D] hover:text-white hover:border-[#E34F2D] transition-all duration-200 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5 transition-transform group-hover/up:-translate-y-0.5" />
                  </button>
                </div>
              ))}
              {receivedPieces.length === 0 && (dossier.missingPieces ?? []).length === 0 && (
                <p className="text-xs font-semibold italic text-slate-400 sm:col-span-2 xl:col-span-3">Aucune pièce attendue.</p>
              )}
            </div>
            <div className="mt-4 flex justify-end border-t border-slate-100/60 pt-3">
              <button
                onClick={() => onNavigateToTab?.("Validations")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#E34F2D]/10 px-3.5 py-2 text-xs font-bold text-[#E34F2D] transition-colors hover:bg-[#E34F2D] hover:text-white cursor-pointer"
              >
                Vérifier dans Validations <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      <CentreInfoModal open={centreInfoOpen} centre={raw?.centre ?? null} onClose={() => setCentreInfoOpen(false)} />

      <AddReminderModal
        open={reminderOpen}
        dossierId={activeDossier?.id ?? null}
        centreLabel={[dossier?.code, dossier?.centre].filter(Boolean).join(" — ")}
        pieceOptions={[...new Set([...(raw?.presentPieces ?? []), ...(raw?.missingPieces ?? [])])].map(
          (code): SelectOption => ({ value: code, label: pieceTypeLabel(code) }),
        )}
        onClose={() => setReminderOpen(false)}
      />
    </div>
  );
}
