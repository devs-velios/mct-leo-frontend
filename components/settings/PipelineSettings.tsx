"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, GitBranch, AlertCircle } from "lucide-react";
import { ApiError } from "@/lib/api";
import { usePipelineContext, type PipelinePhase } from "@/lib/features/pipeline";
import { useRole } from "@/lib/features/auth/RoleProvider";
import { useDialog } from "@/components/ui/DialogProvider";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { DraggableList, type DraggableItemProps } from "@/components/ui/draggable-list";
import PhaseModal, { type PhaseFormValues } from "./PhaseModal";
import { macroLabel, macroTone, roleLabel } from "./pipelineLabels";

// A single drag (splice) moves exactly one item — find which phase changed position
// and its new 0-based index, by removing each candidate and checking the rest match.
function findMovedPhase(oldIds: string[], newIds: string[]): { id: string; index: number } | null {
  if (oldIds.length !== newIds.length) return null;
  if (oldIds.every((v, i) => v === newIds[i])) return null;
  for (let k = 0; k < newIds.length; k++) {
    const cand = newIds[k];
    const a = oldIds.filter((x) => x !== cand);
    const b = newIds.filter((x) => x !== cand);
    if (a.every((v, i) => v === b[i])) return { id: cand, index: k };
  }
  return null;
}

export default function PipelineSettings() {
  const { phases, macroOptions, isLoading, status, error, ensureLoaded, add, edit, remove, move } = usePipelineContext();
  const { canWrite } = useRole(); // pipeline writes are operateur-only
  const { confirm } = useDialog();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<PipelinePhase | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null); // slug being reordered/deleted
  const [rev, setRev] = useState(0); // bump to re-sync the drag list to the authoritative order

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);

  const openCreate = () => { setModalMode("create"); setEditing(null); setModalOpen(true); };
  const openEdit = (p: PipelinePhase) => { setModalMode("edit"); setEditing(p); setModalOpen(true); };

  const handleSubmit = async (v: PhaseFormValues) => {
    setSubmitting(true);
    try {
      if (modalMode === "create") {
        await add({ label: v.label.trim(), macro_statut: v.macro_statut, responsable_role: v.responsable_role });
        toast.success(`Phase « ${v.label.trim()} » ajoutée.`);
      } else if (editing) {
        await edit(editing.name, { label: v.label.trim(), macro_statut: v.macro_statut });
        toast.success("Phase mise à jour.");
      }
      setModalOpen(false);
    } catch (err) {
      const e = err as ApiError;
      toast.error(e.status === 409 ? "Ce slug existe déjà." : e.message || "Échec de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  // Drag-reorder → persist the moved phase's new 1-based position (backend renumbers).
  const handleReorder = async (newItems: DraggableItemProps[]) => {
    const moved = findMovedPhase(phases.map((p) => p.name), newItems.map((i) => i.id));
    if (!moved) return;
    setBusy(moved.id);
    try {
      await move(moved.id, moved.index + 1);
    } catch (err) {
      toast.error((err as ApiError).message || "Échec du déplacement.");
    } finally {
      setBusy(null);
      setRev((r) => r + 1); // re-sync the list to the server's order (revert on failure)
    }
  };

  const handleDelete = async (p: PipelinePhase) => {
    const ok = await confirm({
      title: "Supprimer cette phase ?",
      message: `« ${p.label} » sera retirée du pipeline. Les dossiers encore à cette étape devront d'abord être déplacés.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      danger: true,
    });
    if (!ok) return;
    setBusy(p.name);
    try {
      await remove(p.name);
      toast.success(`Phase « ${p.label} » supprimée.`);
    } catch (err) {
      toast.error((err as ApiError).message || "Suppression impossible.");
    } finally {
      setBusy(null);
    }
  };

  // One phase row (shared by the draggable + read-only renderings).
  const renderRow = (p: PipelinePhase) => (
    <div className="flex items-center gap-3">
      {canWrite && <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-300 active:cursor-grabbing" />}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-black text-[#332151]">{p.order}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#332151]">{p.label}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-400">
          <span className="font-mono">{p.name}</span>
          <span className="text-slate-300"> · </span>
          {roleLabel(p.responsable_role)}
        </p>
      </div>
      <span className={`hidden shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold sm:inline-block ${macroTone(p.macro_statut)}`}>
        {macroLabel(p.macro_statut)}
      </span>
      {canWrite && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => openEdit(p)}
            disabled={busy === p.name}
            title="Modifier"
            aria-label="Modifier la phase"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#332151] transition-colors hover:border-[#E34F2D]/40 hover:text-[#E34F2D] disabled:opacity-40"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleDelete(p)}
            disabled={busy === p.name}
            title="Supprimer"
            aria-label="Supprimer la phase"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#DF3714] transition-colors hover:border-[#DF3714]/30 hover:bg-[#DF3714]/5 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-serif-mct text-lg font-bold text-[#332151]">Phases du pipeline</h2>
          <p className="mt-0.5 text-xs text-[#5A5A7A]">
            Les colonnes du kanban et les étapes des dossiers. {canWrite ? "Glissez-déposez pour réordonner" : "Réordonnez"}, renommez ou remappez chaque phase vers un badge centre.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={openCreate}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#E34F2D] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(234,91,45,0.15)] transition-all hover:bg-[#DF3714] active:scale-95"
          >
            <Plus className="h-4 w-4" /> Ajouter une phase
          </button>
        )}
      </div>

      {!canWrite && (
        <div className="flex items-start gap-2.5 rounded-xl bg-slate-100 px-4 py-3 text-xs font-bold leading-relaxed text-[#5A5A7A]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Accès en lecture seule — seuls les opérateurs peuvent modifier le pipeline.</span>
        </div>
      )}

      {isLoading && phases.length === 0 ? (
        <SkeletonTable rows={6} cols={3} />
      ) : status === "error" ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-xs font-semibold text-rose-600">{error}</div>
      ) : phases.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
          <GitBranch className="h-7 w-7 text-slate-300" />
          <p className="text-xs font-semibold text-slate-400">Aucune phase configurée.</p>
        </div>
      ) : canWrite ? (
        <DraggableList
          key={rev}
          items={phases.map((p) => ({ id: p.name, content: renderRow(p) }))}
          onChange={handleReorder}
        />
      ) : (
        <ul className="space-y-2.5">
          {phases.map((p) => (
            <li key={p.name} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
              {renderRow(p)}
            </li>
          ))}
        </ul>
      )}

      <PhaseModal
        open={modalOpen}
        mode={modalMode}
        phase={editing}
        macroOptions={macroOptions}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
