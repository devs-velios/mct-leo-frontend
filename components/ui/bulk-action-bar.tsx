"use client";

import { useState } from "react";
import { Trash2, X, Loader2 } from "lucide-react";
import { useDialog } from "@/components/ui/DialogProvider";
import { cn } from "@/lib/utils";

export interface BulkActionBarProps {
  count: number;
  /** Clears the current selection. */
  onClear: () => void;
  /**
   * Performs the deletion. Should resolve once the rows are gone (await your
   * API call here). Confirmation is handled by this bar before it's invoked.
   */
  onDelete: () => void | Promise<void>;
  /** Singular/plural noun, e.g. ["dossier", "dossiers"]. */
  noun?: [string, string];
  /** Extra actions rendered to the left of Delete (optional). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Floating contextual bar shown when ≥1 row is selected. Provides "select count",
 * clear, and a destructive bulk-delete guarded by the on-brand confirm dialog.
 */
export function BulkActionBar({
  count,
  onClear,
  onDelete,
  noun = ["élément", "éléments"],
  children,
  className,
}: BulkActionBarProps) {
  const { confirm } = useDialog();
  const [busy, setBusy] = useState(false);

  if (count <= 0) return null;

  const label = count > 1 ? noun[1] : noun[0];

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Supprimer ${count} ${label} ?`,
      message:
        "Cette action est définitive et ne peut pas être annulée. Les éléments sélectionnés seront retirés.",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      danger: true,
    });
    if (!ok) return;
    try {
      setBusy(true);
      await onDelete();
      onClear();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4",
        className,
      )}
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-[#332151] px-3 py-2 pl-4 text-white shadow-[0_12px_40px_rgba(45,42,86,0.35)]">
        <span className="text-sm font-bold tabular-nums">
          {count} {label} sélectionné{count > 1 ? "s" : ""}
        </span>

        <button
          type="button"
          onClick={onClear}
          className="rounded-lg p-1 text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          aria-label="Désélectionner tout"
          title="Désélectionner tout"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-white/15" />

        {children}

        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#E34F2D] px-3 py-1.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-[#DF3714] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Supprimer
        </button>
      </div>
    </div>
  );
}
