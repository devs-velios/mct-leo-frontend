"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, X, User, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import Select from "@/components/ui/Select";

export interface CentreFormValues {
  code_centre: string;
  enseigne: string;
  ville: string;
  type_contrat: "R" | "P";
  activites: string[];
  statut_ouverture: string;
  responsable: string;
  phone: string;
  email: string;
  street: string;
  street2: string;
  zip: string;
  region: string;
  country: string;
}

// Valid statut_ouverture values accepted by the backend.
export const STATUT_OPTIONS = [
  { value: "onboarding", label: "Onboarding" },
  { value: "agrement_en_cours", label: "Agrément en cours" },
  { value: "audit", label: "Audit" },
  { value: "ouvert", label: "Ouvert" },
  { value: "bloque", label: "Bloqué" },
];

const EMPTY: CentreFormValues = {
  code_centre: "",
  enseigne: "",
  ville: "",
  type_contrat: "R",
  activites: ["VL"],
  statut_ouverture: "onboarding",
  responsable: "",
  phone: "",
  email: "",
  street: "",
  street2: "",
  zip: "",
  region: "",
  country: "France",
};

interface Props {
  open: boolean;
  mode?: "create" | "edit";
  initial?: Partial<CentreFormValues>;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: CentreFormValues) => void;
}

const fieldCls =
  "w-full rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-[#1A1A1A] placeholder-slate-400 outline-none transition-all shadow-sm focus:border-[#E34F2D] focus:bg-white";
const labelCls = "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]";

export default function CreateCentreModal({ open, mode = "create", initial, submitting, error, onClose, onSubmit }: Props) {
  const [v, setV] = useState<CentreFormValues>(EMPTY);

  // Reset/prefill whenever the modal opens.
  useEffect(() => {
    if (open) setV({ ...EMPTY, ...initial });
  }, [open, initial]);

  const set = <K extends keyof CentreFormValues>(k: K, val: CentreFormValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const toggleAct = (a: string) =>
    setV((s) => ({ ...s, activites: s.activites.includes(a) ? s.activites.filter((x) => x !== a) : [...s.activites, a] }));

  const canSubmit = v.code_centre.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.96, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E34F2D]/10 text-[#E34F2D] shrink-0">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-xl font-extrabold font-serif-mct text-[#332151] leading-tight">
                    {mode === "edit" ? "Modifier le Centre" : "Créer un Nouveau Centre"}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                    {mode === "edit" ? "Mise à jour des informations" : "Initialisation d'onboarding"}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-[#5A5A7A] hover:text-[#332151] transition cursor-pointer shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); if (canSubmit && !submitting) onSubmit(v); }}
              className="space-y-6"
            >
              {/* 1. Identification */}
              <section className="space-y-4">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#E34F2D]">1. Identification du centre</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Code unique centre *</label>
                    <input className={fieldCls} value={v.code_centre} onChange={(e) => set("code_centre", e.target.value)} placeholder="Ex: CT-LYON-2" disabled={mode === "edit"} />
                  </div>
                  <div>
                    <label className={labelCls}>Enseigne / Réseau</label>
                    <input className={fieldCls} value={v.enseigne} onChange={(e) => set("enseigne", e.target.value)} placeholder="Ex: Norauto Lyon" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Ville</label>
                    <input className={fieldCls} value={v.ville} onChange={(e) => set("ville", e.target.value)} placeholder="Ex: Lyon" />
                  </div>
                  <div>
                    <label className={labelCls}>Type de contrat</label>
                    <div className="flex gap-1.5 rounded-xl bg-slate-50 border border-slate-200/70 p-1">
                      {([["R", "Réseau (R)"], ["P", "Partenaire (P)"]] as const).map(([val, lbl]) => (
                        <button
                          type="button"
                          key={val}
                          onClick={() => set("type_contrat", val)}
                          className={`flex-1 rounded-lg py-2 text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${v.type_contrat === val ? "bg-white text-[#332151] shadow-sm" : "text-[#5A5A7A] hover:text-[#332151]"}`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Activités agréées</label>
                    <div className="flex gap-1.5">
                      {["VL", "PL", "CL"].map((a) => (
                        <button
                          type="button"
                          key={a}
                          onClick={() => toggleAct(a)}
                          className={`flex-1 rounded-xl border py-2.5 text-xs font-extrabold transition-all cursor-pointer ${v.activites.includes(a) ? "border-[#E34F2D] bg-[#E34F2D]/5 text-[#E34F2D] ring-2 ring-[#E34F2D]/25" : "border-slate-200 text-[#5A5A7A] hover:bg-slate-50"}`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {mode === "edit" && (
                  <div className="sm:max-w-xs">
                    <label className={labelCls}>Statut d&apos;ouverture</label>
                    <Select
                      value={v.statut_ouverture}
                      options={STATUT_OPTIONS}
                      onChange={(val) => set("statut_ouverture", val)}
                    />
                  </div>
                )}
              </section>

              {/* 2. Responsables & WhatsApp */}
              <section className="space-y-4 border-t border-slate-100 pt-5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#E34F2D]">2. Responsables &amp; WhatsApp onboarding</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={`${labelCls} flex items-center gap-1.5`}><User className="h-3 w-3" /> Nom du responsable</label>
                    <input className={fieldCls} value={v.responsable} onChange={(e) => set("responsable", e.target.value)} placeholder="Marc Duboc" />
                  </div>
                  <div>
                    <label className={`${labelCls} flex items-center gap-1.5`}><Phone className="h-3 w-3" /> WhatsApp mobile</label>
                    <input className={fieldCls} value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Ex: 33612345678" />
                  </div>
                  <div>
                    <label className={`${labelCls} flex items-center gap-1.5`}><Mail className="h-3 w-3" /> Courriel (email)</label>
                    <input type="email" className={fieldCls} value={v.email} onChange={(e) => set("email", e.target.value)} placeholder="gerant@mail.com" />
                  </div>
                </div>
              </section>

              {/* 3. Localisation */}
              <section className="space-y-4 border-t border-slate-100 pt-5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#E34F2D]">3. Localisation &amp; adresse physique</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`${labelCls} flex items-center gap-1.5`}><MapPin className="h-3 w-3" /> Adresse ligne 1</label>
                    <input className={fieldCls} value={v.street} onChange={(e) => set("street", e.target.value)} placeholder="Ex: 24 Rue de la République" />
                  </div>
                  <div>
                    <label className={labelCls}>Adresse ligne 2 (complément)</label>
                    <input className={fieldCls} value={v.street2} onChange={(e) => set("street2", e.target.value)} placeholder="Ex: Bâtiment B, Escalier 2" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Code postal (ZIP)</label>
                    <input className={fieldCls} value={v.zip} onChange={(e) => set("zip", e.target.value)} placeholder="Ex: 69002" />
                  </div>
                  <div>
                    <label className={labelCls}>Région</label>
                    <input className={fieldCls} value={v.region} onChange={(e) => set("region", e.target.value)} placeholder="Ex: Auvergne-Rhône-Alpes" />
                  </div>
                  <div>
                    <label className={labelCls}>Pays</label>
                    <input className={fieldCls} value={v.country} onChange={(e) => set("country", e.target.value)} placeholder="France" />
                  </div>
                </div>
              </section>

              {error && <p className="text-xs font-bold text-red-600">{error}</p>}

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-xs font-extrabold rounded-xl border border-slate-200 text-[#5A5A7A] hover:bg-slate-50 transition-colors cursor-pointer">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl bg-[#E34F2D] hover:bg-[#DF3714] text-white transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {mode === "edit" ? "Enregistrer" : "Créer le Centre"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
