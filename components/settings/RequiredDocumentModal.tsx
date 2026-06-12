"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, X, Loader2 } from "lucide-react";
import { type RequiredDocument } from "@/lib/features/required-documents";

export interface RequiredDocumentFormValues {
  doc_label: string;
  doc_key: string;
  description: string;
}

export default function RequiredDocumentModal({
  open,
  mode,
  document,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  document?: RequiredDocument | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: RequiredDocumentFormValues) => void;
}) {
  const [values, setValues] = useState<RequiredDocumentFormValues>({ doc_label: "", doc_key: "", description: "" });

  // Reset/prefill whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setValues({
      doc_label: document?.doc_label ?? "",
      doc_key: document?.doc_key ?? "",
      description: document?.description ?? "",
    });
  }, [open, document]);

  const set = <K extends keyof RequiredDocumentFormValues>(k: K, v: RequiredDocumentFormValues[K]) =>
    setValues((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.doc_label.trim()) return;
    onSubmit(values);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#332151]/30 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E34F2D]/10 text-[#E34F2D]">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-serif-mct text-base font-bold text-[#332151]">
                  {mode === "create" ? "Nouveau document requis" : "Modifier le document"}
                </h3>
              </div>
              <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#332151]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4 p-5">
              {/* Label */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Nom du document *</label>
                <input
                  value={values.doc_label}
                  onChange={(e) => set("doc_label", e.target.value)}
                  placeholder="Ex : Extrait Kbis"
                  autoFocus
                  className="w-full rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 text-sm text-[#1A1A1A] outline-none transition-all focus:border-[#E34F2D] focus:bg-white focus:ring-2 focus:ring-[#E34F2D]/20"
                />
              </div>

              {/* Key — optional, auto-slugged when blank */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Clé technique</label>
                <input
                  value={values.doc_key}
                  onChange={(e) => set("doc_key", e.target.value)}
                  placeholder={mode === "create" ? "Auto (dérivée du nom)" : "kbis"}
                  className="w-full rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 font-mono text-sm text-[#1A1A1A] outline-none transition-all focus:border-[#E34F2D] focus:bg-white focus:ring-2 focus:ring-[#E34F2D]/20"
                />
                <p className="mt-1 text-[10px] text-slate-400">Identifiant unique. Laissez vide pour le générer depuis le nom.</p>
              </div>

              {/* OCR description */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Description (reconnaissance OCR)</label>
                <textarea
                  rows={3}
                  value={values.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Décrivez le document pour aider le classificateur OCR à le reconnaître…"
                  className="w-full resize-none rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 text-sm text-[#1A1A1A] outline-none transition-all focus:border-[#E34F2D] focus:bg-white focus:ring-2 focus:ring-[#E34F2D]/20"
                />
                <p className="mt-1 text-[10px] text-slate-400">Si vide, le nom du document est utilisé.</p>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#5A5A7A] transition-colors hover:bg-slate-100">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !values.doc_label.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#E34F2D] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(234,91,45,0.15)] transition-all hover:bg-[#DF3714] active:scale-95 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {mode === "create" ? "Ajouter le document" : "Enregistrer"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
