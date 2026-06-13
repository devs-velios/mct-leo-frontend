"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Building2, X, MapPin, Store, ArrowRight } from "lucide-react";
import type { CentreFull } from "@/lib/features/centres";
import { na } from "@/lib/utils";

const STATUT_LABEL: Record<string, string> = {
  onboarding: "Onboarding",
  agrement_en_cours: "Agrément en cours",
  audit: "Audit",
  ouvert: "Ouvert",
  bloque: "Bloqué",
};
const CONTRAT_LABEL: Record<string, string> = { R: "Réseau", P: "Partenaire" };

function frDate(iso?: string | null): string {
  if (!iso) return "Non disponible";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Non disponible" : d.toLocaleDateString("fr-FR");
}

/** One label/value pair in the information grid. */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-[#332151]">{value}</p>
    </div>
  );
}

/** Read-only modal showing all of a centre's details (mirrors the centre detail card). */
export default function CentreInfoModal({
  open,
  centre,
  onClose,
  onOpenCentre,
}: {
  open: boolean;
  centre: CentreFull | null;
  onClose: () => void;
  /** Navigate to the centre's full profile page. */
  onOpenCentre?: () => void;
}) {
  const contacts = (centre?.contacts_clients ?? {}) as Record<string, unknown>;
  const responsable = (contacts.responsable as string | undefined) ?? null;
  const phone = (contacts.phone as string | undefined) ?? null;
  const email = (contacts.email as string | undefined) ?? null;
  const addressParts = centre
    ? [centre.street, centre.street2, centre.zip, centre.ville, centre.region, centre.country].filter(Boolean)
    : [];

  return (
    <AnimatePresence>
      {open && centre && (
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
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-extrabold font-serif-mct text-[#332151] leading-tight">
                    {na(centre.enseigne ?? centre.code_centre)}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                    Détails du centre
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-[#5A5A7A] hover:text-[#332151] transition cursor-pointer shrink-0"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Informations */}
            <section className="rounded-2xl border border-slate-100 bg-slate-50/40 p-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Field label="Code centre" value={<span className="font-mono">{na(centre.code_centre)}</span>} />
                <Field label="Enseigne" value={na(centre.enseigne)} />
                <Field label="Ville" value={na(centre.ville)} />
                <Field label="Type de contrat" value={CONTRAT_LABEL[centre.type_contrat] ?? na(centre.type_contrat)} />
                <Field label="Activités" value={centre.activites?.length ? centre.activites.join(" · ") : "Non disponible"} />
                <Field label="Statut" value={STATUT_LABEL[centre.statut_ouverture] ?? na(centre.statut_ouverture)} />
                <Field label="Responsable" value={na(responsable)} />
                <Field label="Téléphone" value={na(phone)} />
                <Field label="E-mail" value={na(email)} />
                <Field label="Date de création" value={frDate(centre.created_at)} />
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Adresse</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#332151]">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {addressParts.length ? addressParts.join(", ") : "Non disponible"}
                </p>
              </div>
            </section>

            {/* Go to the centre's full profile page. */}
            {onOpenCentre && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={onOpenCentre}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#332151] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#E34F2D]"
                >
                  <Store className="h-4 w-4" /> Voir la fiche du centre
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
