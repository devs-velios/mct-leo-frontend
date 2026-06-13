"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ShieldAlert, AlertCircle, X, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useRagTopicsContext, type RagTopic } from "@/lib/features/rag-topics";
import { useRole } from "@/lib/features/auth/RoleProvider";
import { useDialog } from "@/components/ui/DialogProvider";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

// Small inline toggle (no shared Switch component in the project).
function Toggle({ on, disabled, onClick }: { on: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        on ? "bg-[#E34F2D]" : "bg-slate-200",
      )}
    >
      <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform", on ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

export default function SensitiveTopicsSettings() {
  const { topics, isLoading, status, error, ensureLoaded, create, update, remove } = useRagTopicsContext();
  const { canWrite } = useRole();
  const { confirm } = useDialog();

  const [busy, setBusy] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ section: "", label: "", requires_approval: true });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);

  const toggle = async (t: RagTopic) => {
    setBusy(t.section);
    try {
      await update(t.section, { requires_approval: !t.requires_approval });
    } catch (err) {
      toast.error((err as ApiError).message || "Échec de la mise à jour.");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (t: RagTopic) => {
    const ok = await confirm({
      title: "Supprimer ce sujet ?",
      message: `« ${t.label} » sera retiré de la liste des sujets. Cette action est définitive.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      danger: true,
    });
    if (!ok) return;
    setBusy(t.section);
    try {
      await remove(t.section);
      toast.success(`« ${t.label} » supprimé.`);
    } catch (err) {
      toast.error((err as ApiError).message || "Suppression impossible.");
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.section.trim() || !form.label.trim()) return;
    setSubmitting(true);
    try {
      await create({ section: form.section.trim(), label: form.label.trim(), requires_approval: form.requires_approval });
      toast.success(`Sujet « ${form.label.trim()} » ajouté.`);
      setAddOpen(false);
      setForm({ section: "", label: "", requires_approval: true });
    } catch (err) {
      const er = err as ApiError;
      toast.error(er.status === 409 ? "Cette clé de sujet existe déjà." : er.message || "Échec de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const approvalCount = topics.filter((t) => t.requires_approval).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-serif-mct text-lg font-bold text-[#332151]">Sujets sensibles</h2>
          <p className="mt-0.5 text-xs text-[#5A5A7A]">
            Quand un sujet exige une « validation superviseur », les réponses de Léo sur ce sujet sont mises en attente
            dans <span className="font-semibold text-[#332151]">Approbations</span> au lieu d&apos;être envoyées automatiquement.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#E34F2D] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(234,91,45,0.15)] transition-all hover:bg-[#DF3714] active:scale-95"
          >
            <Plus className="h-4 w-4" /> Ajouter un sujet
          </button>
        )}
      </div>

      {/* Guidance: the catch-all "autre" should normally stay OFF. */}
      <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-800">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Évitez d&apos;activer le sujet fourre-tout « Autre / non catégorisé » : Léo y classe tout message ambigu, ce qui
          met alors en attente la quasi-totalité des conversations.
        </span>
      </div>

      {!canWrite && (
        <div className="flex items-start gap-2.5 rounded-xl bg-slate-100 px-4 py-3 text-xs font-bold leading-relaxed text-[#5A5A7A]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Accès en lecture seule — seuls les opérateurs peuvent modifier les sujets.</span>
        </div>
      )}

      {isLoading && topics.length === 0 ? (
        <SkeletonTable rows={6} cols={2} />
      ) : status === "error" ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-xs font-semibold text-rose-600">{error}</div>
      ) : topics.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
          <ShieldAlert className="h-7 w-7 text-slate-300" />
          <p className="text-xs font-semibold text-slate-400">Aucun sujet configuré.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {approvalCount} sujet{approvalCount > 1 ? "s" : ""} en validation superviseur
          </p>
          {topics.map((t) => (
            <div
              key={t.section}
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.005)]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#332151]">{t.label}</p>
                <p className="truncate font-mono text-[11px] text-slate-400">{t.section}</p>
              </div>
              <span className={cn("hidden shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold sm:inline-block", t.requires_approval ? "bg-[#E34F2D]/10 text-[#E34F2D]" : "bg-emerald-50 text-emerald-600")}>
                {t.requires_approval ? "Validation requise" : "Réponse auto"}
              </span>
              <Toggle on={t.requires_approval} disabled={!canWrite || busy === t.section} onClick={() => toggle(t)} />
              {canWrite && (
                <button
                  onClick={() => handleDelete(t)}
                  disabled={busy === t.section}
                  title="Supprimer"
                  aria-label="Supprimer le sujet"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#DF3714] transition-colors hover:border-[#DF3714]/30 hover:bg-[#DF3714]/5 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add-topic modal */}
      {addOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#332151]/30 p-4 backdrop-blur-sm" onClick={() => setAddOpen(false)}>
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E34F2D]/10 text-[#E34F2D]">
                  <ShieldAlert className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-serif-mct text-base font-bold text-[#332151]">Nouveau sujet</h3>
              </div>
              <button onClick={() => setAddOpen(false)} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#332151]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Libellé *</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Ex : Réclamations"
                  autoFocus
                  className="w-full rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 text-sm text-[#1A1A1A] outline-none transition-all focus:border-[#E34F2D] focus:bg-white focus:ring-2 focus:ring-[#E34F2D]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Clé technique *</label>
                <input
                  value={form.section}
                  onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                  placeholder="reclamations"
                  className="w-full rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 font-mono text-sm text-[#1A1A1A] outline-none transition-all focus:border-[#E34F2D] focus:bg-white focus:ring-2 focus:ring-[#E34F2D]/20"
                />
              </div>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3">
                <span className="text-xs font-semibold text-[#332151]">Validation superviseur avant envoi</span>
                <Toggle on={form.requires_approval} onClick={() => setForm((f) => ({ ...f, requires_approval: !f.requires_approval }))} />
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setAddOpen(false)} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#5A5A7A] transition-colors hover:bg-slate-100">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.section.trim() || !form.label.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#E34F2D] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(234,91,45,0.15)] transition-all hover:bg-[#DF3714] active:scale-95 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Ajouter le sujet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
