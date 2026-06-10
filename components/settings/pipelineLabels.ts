// Display helpers for the pipeline catalog. The macro badge set is fixed backend-side
// (onboarding / audit / agrement_en_cours, plus ouvert / bloque from other flows).

import { RESPONSABLE_ROLES } from "@/lib/features/pipeline";

const MACRO_LABEL: Record<string, string> = {
  onboarding: "Onboarding",
  audit: "Audit",
  agrement_en_cours: "Agrément en cours",
  ouvert: "Ouvert",
  bloque: "Bloqué",
};

const MACRO_TONE: Record<string, string> = {
  onboarding: "bg-slate-100 text-slate-600 border-slate-200",
  audit: "bg-amber-50 text-amber-700 border-amber-100",
  agrement_en_cours: "bg-indigo-50 text-[#332151] border-indigo-100",
  ouvert: "bg-emerald-50 text-emerald-600 border-emerald-100",
  bloque: "bg-rose-50 text-rose-600 border-rose-100",
};

export const macroLabel = (slug: string) => MACRO_LABEL[slug] ?? slug;
export const macroTone = (slug: string) => MACRO_TONE[slug] ?? "bg-slate-100 text-slate-600 border-slate-200";

const ROLE_LABEL: Record<string, string> = Object.fromEntries(RESPONSABLE_ROLES.map((r) => [r.value, r.label]));
export const roleLabel = (slug: string | null) => (slug ? ROLE_LABEL[slug] ?? slug : "—");
