"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Menu, Send, X, Check, Sparkles, ShieldAlert, Loader2, Inbox, Eye } from "lucide-react";
import { useRagContext, type RagSuggestion, type RagSuggestionFilter } from "@/lib/features/rag";
import { useCentresContext } from "@/lib/features/centres";
import { useDialog } from "@/components/ui/DialogProvider";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ResponsiveTabs } from "@/components/ui/responsive-tabs";
import { useRowSelection } from "@/components/hooks/useRowSelection";
import Markdown from "@/components/ui/Markdown";

interface RagApprovalsViewProps {
  setMobileMenuOpen?: (open: boolean) => void;
  onOpenDossier?: (id: string) => void;
}

const TABS: { key: RagSuggestionFilter; label: string }[] = [
  { key: "pending", label: "À valider" },
  { key: "approved", label: "Approuvées" },
  { key: "rejected", label: "Rejetées" },
];

export default function RagApprovalsView({ setMobileMenuOpen, onOpenDossier }: RagApprovalsViewProps) {
  const { suggestions, isLoading: loading, ensureLoaded, refresh, approve, reject, approveMany, rejectMany } = useRagContext();
  const { centres, ensureList } = useCentresContext();
  const { confirm } = useDialog();
  const [tab, setTab] = useState<RagSuggestionFilter>("pending");
  // The suggestion shown full-screen in the "view answer" modal.
  const [viewing, setViewing] = useState<RagSuggestion | null>(null);

  // Cache-guarded: fetch each tab once, reuse across navigations.
  useEffect(() => { ensureLoaded({ status: tab }); }, [tab, ensureLoaded]);
  // Centre list (cached, shared) — to label suggestions by centre name, not UUID.
  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);

  const isPending = tab === "pending";
  const centreLabel = (id: string) => {
    const c = centres.find((x) => x.id === id);
    return c?.enseigne ?? c?.code_centre ?? `${id.slice(0, 8)}…`;
  };

  // Selection (pending tab only) — scoped to the whole pending list.
  const selection = useRowSelection(suggestions.map((s) => s.id));

  // ── Single-row actions ───────────────────────────────────────────────────────
  const handleApprove = async (s: RagSuggestion) => {
    const ok = await confirm({
      title: "Approuver et envoyer ?",
      message: `La réponse de Léo sera envoyée au client de ${centreLabel(s.centre_id)} par WhatsApp.`,
      confirmLabel: "Approuver & envoyer",
    });
    if (!ok) return;
    try { await approve(s.id); toast.success("Réponse approuvée et envoyée."); }
    catch { toast.error("Échec de l'approbation."); refresh({ status: tab }); }
  };

  const handleReject = async (s: RagSuggestion) => {
    const ok = await confirm({
      title: "Rejeter cette réponse ?",
      message: "La réponse proposée sera écartée. Rien ne sera envoyé au client.",
      confirmLabel: "Rejeter",
    });
    if (!ok) return;
    try { await reject(s.id); toast.success("Réponse rejetée."); }
    catch { toast.error("Échec du rejet."); refresh({ status: tab }); }
  };

  // ── Bulk actions ─────────────────────────────────────────────────────────────
  const [bulkBusy, setBulkBusy] = useState(false);
  const runBulk = async (kind: "approve" | "reject") => {
    const ids = selection.selectedIds;
    if (ids.length === 0) return;
    const ok = await confirm(
      kind === "approve"
        ? {
            title: `Approuver ${ids.length} réponse${ids.length > 1 ? "s" : ""} ?`,
            message: "Les réponses sélectionnées seront envoyées aux clients par WhatsApp.",
            confirmLabel: "Tout approuver",
          }
        : {
            title: `Rejeter ${ids.length} réponse${ids.length > 1 ? "s" : ""} ?`,
            message: "Les réponses sélectionnées seront écartées. Rien ne sera envoyé aux clients.",
            confirmLabel: "Tout rejeter",
          },
    );
    if (!ok) return;
    try {
      setBulkBusy(true);
      const done = kind === "approve" ? await approveMany(ids) : await rejectMany(ids);
      selection.clear();
      toast.success(`${done} réponse${done > 1 ? "s" : ""} ${kind === "approve" ? "approuvée" : "rejetée"}${done > 1 ? "s" : ""}.`);
    } finally {
      setBulkBusy(false);
    }
  };

  const statusBadge = (s: RagSuggestion) =>
    s.status === "approved" ? (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Approuvée</span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">Rejetée</span>
    );

  const columns: DataTableColumn<RagSuggestion>[] = [
    {
      id: "centre",
      header: "Centre",
      width: "minmax(150px,1fr)",
      cell: (s) => (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenDossier?.(s.centre_id); }}
          className="truncate text-left text-sm font-bold text-[#332151] transition-colors hover:text-[#E34F2D]"
          title={centreLabel(s.centre_id)}
        >
          {centreLabel(s.centre_id)}
        </button>
      ),
    },
    {
      id: "question",
      header: "Question du client",
      width: "minmax(200px,1.4fr)",
      cell: (s) => <p className="line-clamp-2 text-xs leading-relaxed text-[#5A5A7A]" title={s.question}>{s.question}</p>,
    },
    {
      id: "answer",
      header: "Réponse de Léo",
      width: "minmax(220px,1.6fr)",
      cell: (s) => {
        const text = s.final_answer ?? s.draft_answer;
        // First two lines only (markdown symbols stripped) — full formatted text in the eye modal.
        const preview = (text ?? "").replace(/[*_#`>~]/g, "").replace(/\s+/g, " ").trim();
        return (
          <div className="min-w-0">
            <p className="line-clamp-2 text-xs leading-relaxed text-[#1A1A1A]" title={text}>{preview}</p>
            {isPending && s.sensitive_reason && (
              <span className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                <ShieldAlert className="h-2.5 w-2.5" /> {s.sensitive_reason}
              </span>
            )}
          </div>
        );
      },
    },
    isPending
      ? {
          id: "recuLe",
          header: "Reçu le",
          width: "130px",
          cell: (s) => <span className="text-[11px] text-slate-400">{new Date(s.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>,
        }
      : {
          id: "statut",
          header: "Statut",
          width: "120px",
          cell: (s) => statusBadge(s),
        },
    ...(isPending
      ? []
      : [{
          id: "revuLe",
          header: "Revu le",
          width: "130px",
          cell: (s: RagSuggestion) => <span className="text-[11px] text-slate-400">{s.reviewed_at ? new Date(s.reviewed_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</span>,
        } as DataTableColumn<RagSuggestion>]),
    {
      id: "actions",
      header: "Actions",
      width: isPending ? "150px" : "80px",
      align: "right",
      cell: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); setViewing(s); }}
            title="Voir la réponse complète"
            aria-label="Voir la réponse complète"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#5A5A7A] transition hover:border-[#E34F2D]/40 hover:text-[#E34F2D] active:scale-95 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
          </button>
          {isPending && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleApprove(s); }}
                title="Approuver & envoyer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#332151] text-white transition hover:bg-[#E34F2D] active:scale-95 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleReject(s); }}
                title="Rejeter"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#5A5A7A] transition hover:bg-rose-50 hover:text-rose-600 active:scale-95 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <header className="border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur lg:px-6">
        <div className="mb-3 flex items-center justify-between md:hidden">
          <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
          <button onClick={() => setMobileMenuOpen?.(true)} className="rounded-lg p-2 text-[#332151] hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E34F2D]/10 text-[#E34F2D]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif-mct text-base sm:text-xl font-bold text-[#332151]">Réponses Léo à valider</h1>
            <p className="text-xs text-[#5A5A7A]">Approuvez ou rejetez les réponses sensibles avant leur envoi au client</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-[#F5F5F7] p-4 lg:p-6">
        <div className="mx-auto max-w-[1100px] space-y-5">
          {/* Tabs (dropdown on mobile) */}
          <ResponsiveTabs
            value={tab}
            onValueChange={(v) => { setTab(v as RagSuggestionFilter); selection.clear(); }}
            className="w-full sm:w-auto"
            options={TABS.map((t) => ({ value: t.key, label: t.label }))}
          />

          {/* Table */}
          {loading && suggestions.length === 0 ? (
            <SkeletonTable rows={6} cols={5} />
          ) : (
            <div className="rounded-3xl border border-slate-100/80 bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
              <DataTable<RagSuggestion>
                data={suggestions}
                getRowId={(s) => s.id}
                minWidth="780px"
                hideToolbar
                bare
                pagination="internal"
                itemsPerPage={10}
                selection={isPending ? selection : undefined}
                columns={columns}
                emptyMessage={
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Inbox className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-[#332151]">
                      {isPending ? "Aucune réponse à valider" : tab === "approved" ? "Aucune réponse approuvée" : "Aucune réponse rejetée"}
                    </p>
                    <p className="max-w-xs text-xs text-[#5A5A7A]">
                      {isPending
                        ? "Léo répond automatiquement aux questions courantes. Seules les réponses sensibles arrivent ici."
                        : "L'historique est vide pour ce filtre."}
                    </p>
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Bulk approve / reject bar (pending tab) */}
      {isPending && selection.count > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-[#332151] px-3 py-2 pl-4 text-white shadow-[0_12px_40px_rgba(45,42,86,0.35)]">
            <span className="text-sm font-bold tabular-nums">
              {selection.count} sélectionnée{selection.count > 1 ? "s" : ""}
            </span>
            <button onClick={selection.clear} title="Désélectionner tout" className="rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
            <span className="mx-1 h-5 w-px bg-white/15" />
            <button
              onClick={() => runBulk("reject")}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
            >
              <X className="h-4 w-4" /> Rejeter
            </button>
            <button
              onClick={() => runBulk("approve")}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#E34F2D] px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-[#DF3714] disabled:opacity-60"
            >
              {bulkBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approuver
            </button>
          </div>
        </div>
      )}

      {/* Full-answer modal (opened by the eye button). */}
      {viewing && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#332151]/30 p-4 backdrop-blur-sm"
          onClick={() => setViewing(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E34F2D]/10 text-[#E34F2D]">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif-mct text-base font-bold text-[#332151]">Réponse de Léo</h3>
                  <p className="truncate text-[11px] text-[#5A5A7A]">{centreLabel(viewing.centre_id)}</p>
                </div>
              </div>
              <button onClick={() => setViewing(null)} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#332151]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5 custom-scrollbar">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Question du client</p>
                <p className="mt-1 text-sm font-semibold text-[#332151]">{viewing.question}</p>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#E34F2D]">Réponse</p>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <Markdown>{viewing.final_answer ?? viewing.draft_answer}</Markdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
