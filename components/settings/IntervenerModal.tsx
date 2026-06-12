"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCog, X, Loader2 } from "lucide-react";
import { SingleSelect } from "@/components/ui/single-select";
import { MultiSelect } from "@/components/ui/multi-select";
import { CATEGORY_LABEL, ACTIVITY_VALUES, type Intervener, type IntervenerCategory } from "@/lib/features/interveners";
import { type Department } from "@/lib/features/departments";

export interface IntervenerFormValues {
  name: string;
  phone_number: string;
  role: string;
  category: string;
  sectors: string[];
  activities: string[];
}

export default function IntervenerModal({
  open,
  mode,
  intervener,
  categoryOptions,
  departments,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  intervener?: Intervener | null;
  /** Live category catalog (value + description) from /interveners/categories. */
  categoryOptions: IntervenerCategory[];
  /** Department reference list for the sectors picker. */
  departments: Department[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: IntervenerFormValues) => void;
}) {
  const [v, setV] = useState<IntervenerFormValues>({ name: "", phone_number: "", role: "", category: "always", sectors: [], activities: [] });

  useEffect(() => {
    if (!open) return;
    setV({
      name: intervener?.name ?? "",
      phone_number: intervener?.phone_number ?? "",
      role: intervener?.role ?? "",
      category: intervener?.category ?? "always",
      sectors: intervener?.sectors ?? [],
      activities: intervener?.activities ?? [],
    });
  }, [open, intervener]);

  const set = <K extends keyof IntervenerFormValues>(k: K, val: IntervenerFormValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const toggleActivity = (a: string) =>
    setV((s) => ({ ...s, activities: s.activities.includes(a) ? s.activities.filter((x) => x !== a) : [...s.activities, a] }));

  // Category dropdown (live catalog, fallback to static labels) + the helper text.
  const catOpts = categoryOptions.length
    ? categoryOptions.map((c) => ({ value: c.value, label: CATEGORY_LABEL[c.value] ?? c.value }))
    : Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }));
  const catDescription = categoryOptions.find((c) => c.value === v.category)?.description;
  // Department options: show "code · name", store the code.
  const deptOptions = departments.map((d) => ({ value: d.code, label: `${d.code} · ${d.name}` }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.name.trim() || !v.phone_number.trim()) return;
    onSubmit({ ...v, name: v.name.trim(), phone_number: v.phone_number.trim(), role: v.role.trim() });
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
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-100 bg-white shadow-2xl"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E34F2D]/10 text-[#E34F2D]">
                  <UserCog className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-serif-mct text-base font-bold text-[#332151]">
                  {mode === "create" ? "Nouvel intervenant" : "Modifier l'intervenant"}
                </h3>
              </div>
              <button onClick={onClose} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#332151]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom *" value={v.name} onChange={(val) => set("name", val)} placeholder="Jean Dupont" autoFocus />
                <Field label="Téléphone *" value={v.phone_number} onChange={(val) => set("phone_number", val)} placeholder="+33 6 12 34 56 78" />
                <Field label="Fonction" value={v.role} onChange={(val) => set("role", val)} placeholder="Commercial Sud" />
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Catégorie</label>
                  <SingleSelect value={v.category} onChange={(val) => set("category", val)} options={catOpts} placeholder="Catégorie" className="w-full" fullWidth />
                  {catDescription && <p className="mt-1 text-[10px] leading-snug text-slate-400">{catDescription}</p>}
                </div>
              </div>

              {/* Sectors — departments multi-select (shows name, stores the code) */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Départements couverts</label>
                <MultiSelect
                  options={deptOptions}
                  selected={v.sectors}
                  onChange={(vals) => set("sectors", vals)}
                  placeholder="Sélectionner des départements"
                  searchPlaceholder="Rechercher un département…"
                  emptyText="Aucun département."
                  className="w-full"
                  contentClassName="w-[min(360px,90vw)]"
                  listClassName="max-h-[240px]"
                />
                <p className="mt-1 text-[10px] text-slate-400">Utile pour les catégories « Commercial » et « Auditeur ».</p>
              </div>

              {/* Activities */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Activités</label>
                <div className="flex gap-2">
                  {ACTIVITY_VALUES.map((a) => {
                    const active = v.activities.includes(a);
                    return (
                      <button
                        type="button"
                        key={a}
                        onClick={() => toggleActivity(a)}
                        className={`rounded-xl border px-5 py-2.5 text-xs font-extrabold transition-all ${
                          active
                            ? "border-[#E34F2D] bg-[#E34F2D]/5 text-[#E34F2D] ring-2 ring-[#E34F2D]/25"
                            : "border-slate-200 text-[#5A5A7A] hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#5A5A7A] transition-colors hover:bg-slate-100">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !v.name.trim() || !v.phone_number.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#E34F2D] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(234,91,45,0.15)] transition-all hover:bg-[#DF3714] active:scale-95 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {mode === "create" ? "Ajouter" : "Enregistrer"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, value, onChange, placeholder, autoFocus }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 text-sm text-[#1A1A1A] outline-none transition-all focus:border-[#E34F2D] focus:bg-white focus:ring-2 focus:ring-[#E34F2D]/20"
      />
    </div>
  );
}
