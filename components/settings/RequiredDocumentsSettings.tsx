"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FileText, AlertCircle } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  useRequiredDocumentsContext,
  type RequiredDocument,
} from "@/lib/features/required-documents";
import { useRole } from "@/lib/features/auth/RoleProvider";
import { useDialog } from "@/components/ui/DialogProvider";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { TableToolbar } from "@/components/ui/table-toolbar";
import RequiredDocumentModal, { type RequiredDocumentFormValues } from "./RequiredDocumentModal";

export default function RequiredDocumentsSettings() {
  const { documents, isLoading, status, error, ensureLoaded, create, update, remove } = useRequiredDocumentsContext();
  const { canWrite } = useRole();
  const { confirm } = useDialog();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<RequiredDocument | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);

  const openCreate = () => { setModalMode("create"); setEditing(null); setModalOpen(true); };
  const openEdit = (d: RequiredDocument) => { setModalMode("edit"); setEditing(d); setModalOpen(true); };

  const handleSubmit = async (v: RequiredDocumentFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        doc_label: v.doc_label.trim(),
        doc_key: v.doc_key.trim() || undefined,
        description: v.description.trim() || undefined,
      };
      if (modalMode === "create") {
        await create(payload);
        toast.success(`Document « ${payload.doc_label} » ajouté.`);
      } else if (editing) {
        await update(editing.id, {
          doc_label: v.doc_label.trim(),
          doc_key: v.doc_key.trim() || undefined,
          description: v.description.trim() || undefined,
        });
        toast.success("Document mis à jour.");
      }
      setModalOpen(false);
    } catch (err) {
      const e = err as ApiError;
      toast.error(e.status === 409 ? "Cette clé technique existe déjà." : e.message || "Échec de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (d: RequiredDocument) => {
    const ok = await confirm({
      title: "Supprimer ce document ?",
      message: `« ${d.doc_label} » sera retiré de la checklist des documents requis. Cette action est définitive.`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      danger: true,
    });
    if (!ok) return;
    setBusy(d.id);
    try {
      await remove(d.id);
      toast.success(`« ${d.doc_label} » supprimé.`);
    } catch (err) {
      toast.error((err as ApiError).message || "Suppression impossible.");
    } finally {
      setBusy(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) =>
      [d.doc_label, d.doc_key, d.description].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [documents, search]);

  const columns: DataTableColumn<RequiredDocument>[] = [
    {
      id: "document",
      header: "Document",
      width: "minmax(180px,1.2fr)",
      cell: (d) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#332151]">{d.doc_label}</p>
          <p className="truncate font-mono text-[11px] text-slate-400">{d.doc_key}</p>
        </div>
      ),
    },
    {
      id: "description",
      header: "Description (OCR)",
      width: "minmax(220px,2fr)",
      cell: (d) =>
        d.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-[#5A5A7A]" title={d.description}>{d.description}</p>
        ) : (
          <span className="text-xs italic text-slate-300">—</span>
        ),
    },
    ...(canWrite
      ? [{
          id: "actions",
          header: "",
          width: "90px",
          align: "right" as const,
          cell: (d: RequiredDocument) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => openEdit(d)}
                disabled={busy === d.id}
                title="Modifier"
                aria-label="Modifier le document"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#332151] transition-colors hover:border-[#E34F2D]/40 hover:text-[#E34F2D] disabled:opacity-40"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleDelete(d)}
                disabled={busy === d.id}
                title="Supprimer"
                aria-label="Supprimer le document"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#DF3714] transition-colors hover:border-[#DF3714]/30 hover:bg-[#DF3714]/5 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ),
        } as DataTableColumn<RequiredDocument>]
      : []),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-serif-mct text-lg font-bold text-[#332151]">Documents requis</h2>
          <p className="mt-0.5 text-xs text-[#5A5A7A]">
            La checklist des pièces attendues pour chaque centre. La description aide le classificateur OCR à reconnaître le type de document.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={openCreate}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#E34F2D] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(234,91,45,0.15)] transition-all hover:bg-[#DF3714] active:scale-95"
          >
            <Plus className="h-4 w-4" /> Ajouter un document
          </button>
        )}
      </div>

      {!canWrite && (
        <div className="flex items-start gap-2.5 rounded-xl bg-slate-100 px-4 py-3 text-xs font-bold leading-relaxed text-[#5A5A7A]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Accès en lecture seule — seuls les opérateurs peuvent modifier la checklist.</span>
        </div>
      )}

      {isLoading && documents.length === 0 ? (
        <SkeletonTable rows={6} cols={3} />
      ) : status === "error" ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-xs font-semibold text-rose-600">{error}</div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
          <FileText className="h-7 w-7 text-slate-300" />
          <p className="text-xs font-semibold text-slate-400">Aucun document requis configuré.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <TableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Rechercher un document, une clé…" />
          <div className="rounded-3xl border border-slate-100/80 bg-white p-4 shadow-sm sm:p-5">
            <DataTable<RequiredDocument>
              data={filtered}
              getRowId={(d) => d.id}
              columns={columns}
              minWidth="640px"
              hideToolbar
              bare
              emptyMessage="Aucun document ne correspond à votre recherche."
            />
          </div>
        </div>
      )}

      <RequiredDocumentModal
        open={modalOpen}
        mode={modalMode}
        document={editing}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
