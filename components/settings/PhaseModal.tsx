"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, X, Loader2 } from "lucide-react";
import { SingleSelect } from "@/components/ui/single-select";
import { RESPONSABLE_ROLES, type PipelinePhase } from "@/lib/features/pipeline";
import { macroLabel } from "./pipelineLabels";

export interface PhaseFormValues {
  label: string;
  macro_statut: string;
  responsable_role: string;
}

export default function PhaseModal({
  open,
  mode,
  phase,
  macroOptions = [],
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  phase?: PipelinePhase | null;
  macroOptions: string[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: PhaseFormValues) => void;
}) {
  const [values, setValues] = useState<PhaseFormValues>({ label: "", macro_statut: "", responsable_role: "operateur_vl_cl" });

  // Reset the form whenever the modal opens (prefill in edit mode). Depend on the
  // primitive first-macro fallback, not the array identity — `macroOptions` is a fresh
  // reference each render, which would otherwise re-fire this effect on a loop.
  const macroFallback = macroOptions[0] ?? "";
  useEffect(() => {
    if (!open) return;
    setValues({
      label: phase?.label ?? "",
      macro_statut: phase?.macro_statut ?? macroFallback,
      responsable_role: phase?.responsable_role ?? "operateur_vl_cl",
    });
  }, [open, phase, macroFallback]);

  const set = <K extends keyof PhaseFormValues>(k: K, v: PhaseFormValues[K]) => setValues((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.label.trim() || !values.macro_statut) return;
    onSubmit(values);
  };

  const macroSelectOptions = macroOptions.map((m) => ({ value: m, label: macroLabel(m) }));

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
                  <GitBranch className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-serif-mct text-base font-bold text-[#332151]">
                  {mode === "create" ? "Nouvelle phase" : "Modifier la phase"}
                </h3>
              </div>
              <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#332151]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4 p-5">
              {/* Label */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Libellé *</label>
                <input
                  value={values.label}
                  onChange={(e) => set("label", e.target.value)}
                  placeholder="Ex : Pré-visite terrain"
                  autoFocus
                  className="w-full rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 text-sm text-[#1A1A1A] outline-none transition-all focus:border-[#E34F2D] focus:bg-white focus:ring-2 focus:ring-[#E34F2D]/20"
                />
              </div>

              {/* Macro badge */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Statut macro (badge centre) *</label>
                <SingleSelect
                  value={values.macro_statut}
                  onChange={(v) => set("macro_statut", v)}
                  options={macroSelectOptions}
                  placeholder="Choisir un statut"
                  className="w-full"
                  fullWidth
                />
              </div>

              {/* Responsable — only settable at creation (PATCH can't change it) */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Rôle responsable</label>
                {mode === "create" ? (
                  <SingleSelect
                    value={values.responsable_role}
                    onChange={(v) => set("responsable_role", v)}
                    options={RESPONSABLE_ROLES.map((r) => ({ value: r.value, label: r.label }))}
                    placeholder="Choisir un rôle"
                    className="w-full"
                    fullWidth
                  />
                ) : (
                  <div className="rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-400">
                    {RESPONSABLE_ROLES.find((r) => r.value === values.responsable_role)?.label ?? values.responsable_role ?? "—"}
                    <span className="ml-1.5 text-[10px] font-bold">(non modifiable)</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#5A5A7A] transition-colors hover:bg-slate-100">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !values.label.trim() || !values.macro_statut}
                  className="flex items-center gap-2 rounded-xl bg-[#E34F2D] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(234,91,45,0.15)] transition-all hover:bg-[#DF3714] active:scale-95 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {mode === "create" ? "Ajouter la phase" : "Enregistrer"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
