"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Phone } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useIntervenersContext, CATEGORY_LABEL, type Intervener } from "@/lib/features/interveners";
import { useRole } from "@/lib/features/auth/RoleProvider";
import { useDialog } from "@/components/ui/DialogProvider";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { DataTable } from "@/components/ui/data-table";
import { SingleSelect } from "@/components/ui/single-select";
import { useRowSelection } from "@/components/hooks/useRowSelection";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import IntervenerModal, { type IntervenerFormValues } from "./IntervenerModal";

export default function IntervenersSettings({ readOnly = false }: { readOnly?: boolean }) {
  const { interveners, categories, isLoading, status, error, ensureLoaded, create, update, remove } = useIntervenersContext();
  const { canWrite } = useRole();
  // Whitelist page is consultation-only; gate every write control behind this.
  const canEdit = canWrite && !readOnly;
  const { confirm } = useDialog();

  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Intervener | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);

  const rows = useMemo(
    () => (categoryFilter ? interveners.filter((i) => i.category === categoryFilter) : interveners),
    [interveners, categoryFilter],
  );

  // Multi-select + bulk delete (scoped to the filtered rows).
  const selection = useRowSelection(rows.map((i) => i.id));
  const handleBulkDelete = async () => {
    await Promise.all([...new Set(selection.selectedIds)].map((id) => remove(id).catch(() => {})));
  };

  const categoryOptions = useMemo(
    () => [{ value: "", label: "Toutes les catégories" }, ...categories.map((c) => ({ value: c, label: CATEGORY_LABEL[c] ?? c }))],
    [categories],
  );

  const openCreate = () => { setModalMode("create"); setEditing(null); setModalOpen(true); };
  const openEdit = (i: Intervener) => { setModalMode("edit"); setEditing(i); setModalOpen(true); };

  const handleSubmit = async (v: IntervenerFormValues) => {
    setSubmitting(true);
    try {
      const payload = { name: v.name, phone_number: v.phone_number, role: v.role || undefined, category: v.category, sectors: v.sectors, activities: v.activities };
      if (modalMode === "create") {
        await create(payload);
        toast.success(`Intervenant « ${v.name} » ajouté.`);
      } else if (editing) {
        await update(editing.id, payload);
        toast.success("Intervenant mis à jour.");
      }
      setModalOpen(false);
    } catch (err) {
      const e = err as ApiError;
      toast.error(e.status === 409 ? "Ce numéro de téléphone existe déjà." : e.message || "Échec de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (i: Intervener) => {
    const ok = await confirm({
      title: "Supprimer cet intervenant ?",
      message: `« ${i.name} » sera retiré de la whitelist interne.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      danger: true,
    });
    if (!ok) return;
    try {
      await remove(i.id);
      toast.success(`« ${i.name} » supprimé.`);
    } catch (err) {
      toast.error((err as ApiError).message || "Suppression impossible.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-serif-mct text-lg font-bold text-[#332151]">Intervenants internes</h2>
          <p className="mt-0.5 text-xs text-[#5A5A7A]">
            Whitelist du personnel MCT — ajout aux groupes WhatsApp et notifications selon le département et le type de document.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SingleSelect value={categoryFilter} onChange={setCategoryFilter} options={categoryOptions} placeholder="Catégorie" className="w-48" />
          {canEdit && (
            <button
              onClick={openCreate}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#E34F2D] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(234,91,45,0.15)] transition-all hover:bg-[#DF3714] active:scale-95"
            >
              <Plus className="h-4 w-4" /> Ajouter
            </button>
          )}
        </div>
      </div>

      {isLoading && interveners.length === 0 ? (
        <SkeletonTable rows={6} cols={5} />
      ) : status === "error" ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-xs font-semibold text-rose-600">{error}</div>
      ) : (
        <div className="rounded-3xl border border-slate-100/80 bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
          <DataTable<Intervener>
            data={rows}
            getRowId={(i) => i.id}
            minWidth="820px"
            hideToolbar
            bare
            selection={canEdit ? selection : undefined}
            onRowClick={canEdit ? openEdit : undefined}
            emptyMessage="Aucun intervenant."
            columns={[
              {
                id: "name",
                header: "Intervenant",
                width: "minmax(180px,1.4fr)",
                cell: (i) => (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#332151]">{i.name}</p>
                    {i.role && <p className="mt-0.5 truncate text-[11px] text-slate-500">{i.role}</p>}
                  </div>
                ),
              },
              {
                id: "phone",
                header: "Téléphone",
                width: "150px",
                cell: (i) => (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#5A5A7A]">
                    <Phone className="h-3 w-3 text-slate-400" /> {i.phone_number}
                  </span>
                ),
              },
              {
                id: "category",
                header: "Catégorie",
                width: "150px",
                cell: (i) => (
                  <span className="inline-flex items-center rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-[#332151]">
                    {CATEGORY_LABEL[i.category] ?? i.category}
                  </span>
                ),
              },
              {
                id: "sectors",
                header: "Départements",
                width: "minmax(140px,1fr)",
                cell: (i) =>
                  i.sectors.length ? (
                    <span className="text-[11px] font-semibold text-[#5A5A7A]">
                      {i.sectors.slice(0, 6).join(", ")}
                      {i.sectors.length > 6 && <span className="text-slate-400"> +{i.sectors.length - 6}</span>}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">—</span>
                  ),
              },
              {
                id: "activities",
                header: "Activités",
                width: "110px",
                cell: (i) => <span className="text-[11px] font-semibold text-[#5A5A7A]">{i.activities.length ? i.activities.join(" · ") : "—"}</span>,
              },
              ...(canEdit
                ? [
                    {
                      id: "actions",
                      header: "",
                      width: "90px",
                      align: "right" as const,
                      cell: (i: Intervener) => (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(i); }}
                            title="Modifier"
                            aria-label="Modifier l'intervenant"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#332151] transition-colors hover:border-[#E34F2D]/40 hover:text-[#E34F2D]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(i); }}
                            title="Supprimer"
                            aria-label="Supprimer l'intervenant"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#DF3714] transition-colors hover:border-[#DF3714]/30 hover:bg-[#DF3714]/5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      )}

      <IntervenerModal
        open={modalOpen}
        mode={modalMode}
        intervener={editing}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      {canEdit && (
        <BulkActionBar
          count={selection.count}
          onClear={selection.clear}
          onDelete={handleBulkDelete}
          noun={["intervenant", "intervenants"]}
        />
      )}
    </div>
  );
}
