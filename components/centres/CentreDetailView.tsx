"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, MapPin, FolderOpen, Pencil, Trash2 } from "lucide-react";
import { useCentresContext, type UpdateCentrePayload } from "@/lib/features/centres";
import { useDeleteCentre } from "@/lib/features/useDeleteCentre";
import { useDialog } from "@/components/ui/DialogProvider";
import CreateCentreModal, { type CentreFormValues } from "@/components/centres/CreateCentreModal";
import { na } from "@/lib/utils";

const STATUT_LABEL: Record<string, string> = {
  onboarding: "Onboarding",
  agrement_en_cours: "Agrément en cours",
  audit: "Audit",
  ouvert: "Ouvert",
  bloque: "Bloqué",
};

const CONTRAT_LABEL: Record<string, string> = { R: "Réseau", P: "Partenaire" };

const STAGE_LABEL: Record<string, string> = {
  signature_validee: "Signature validée",
  plans_valides: "Plans validés",
  installation_qualite: "Installation & qualité",
  audit: "Audit",
  depot_agrement: "Dépôt agrément",
  agrement_recu: "Agrément reçu",
  ouverture: "Ouverture",
};

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

/** Simple white panel with a title. */
function Section({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-100 bg-white p-5 ${className ?? ""}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#332151]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function CentreDetailView({
  centreId,
  onBack,
  onOpenDossier,
  onViewOnMap,
}: {
  centreId: string;
  onBack: () => void;
  /** Open a specific dossier (file) of this centre. */
  onOpenDossier?: (dossierId: string) => void;
  /** Navigate to the MCT map (optionally focused on this centre). */
  onViewOnMap?: () => void;
}) {
  const { detail: ctxDetail, detailStatus, ensureDetail, update } = useCentresContext();
  const deleteCentre = useDeleteCentre(); // deletes the centre + refreshes both caches
  const { confirm } = useDialog();

  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Cache-guarded load via the shared context — instant on revisit, no refetch.
  useEffect(() => { ensureDetail(centreId); }, [centreId, ensureDetail]);

  // Only treat the context detail as ours once it matches the requested centre.
  const detail = ctxDetail && ctxDetail.centre.id === centreId ? ctxDetail : null;
  const error = detailStatus === "error" && !detail;

  // Persist edits via PATCH /centres/:id, then refresh the local detail.
  const handleEditSubmit = async (v: CentreFormValues) => {
    setSubmitting(true);
    const existingContacts = (detail?.centre.contacts_clients ?? {}) as Record<string, unknown>;
    const contacts: Record<string, unknown> = { ...existingContacts };
    if (v.responsable.trim()) contacts.responsable = v.responsable.trim();
    if (v.phone.trim()) contacts.phone = v.phone.trim();
    if (v.email.trim()) contacts.email = v.email.trim();

    const payload: UpdateCentrePayload = {
      code_centre: v.code_centre.trim(),
      enseigne: v.enseigne.trim() || undefined,
      ville: v.ville.trim() || undefined,
      type_contrat: v.type_contrat,
      activites: v.activites,
      statut_ouverture: v.statut_ouverture,
      street: v.street.trim() || undefined,
      street2: v.street2.trim() || undefined,
      zip: v.zip.trim() || undefined,
      region: v.region.trim() || undefined,
      country: v.country.trim() || undefined,
      contacts_clients: contacts,
    };
    try {
      await update(centreId, payload); // context re-pulls detail + list slice
      setEditOpen(false);
      toast.success("Centre mis à jour.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la mise à jour.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete the centre (DELETE /centres/:id) after confirmation, then go back.
  const handleDelete = async () => {
    const ok = await confirm({
      title: "Supprimer ce centre ?",
      message: "Cette action est définitive et supprimera le centre et ses données associées.",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteCentre(centreId);
      onBack();
    } catch {
      /* keep the user on the page if deletion fails */
    }
  };

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#F5F5F7]">
        <p className="text-sm font-bold text-slate-500">Centre introuvable.</p>
        <button onClick={onBack} className="rounded-xl bg-[#332151] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#E34F2D]">
          Retour aux centres
        </button>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F5F5F7]">
        <span className="animate-pulse text-xs font-bold uppercase tracking-widest text-slate-400">
          Chargement du centre…
        </span>
      </div>
    );
  }

  const c = detail.centre;
  const responsable = (c.contacts_clients?.responsable as string | undefined) ?? null;
  const name = c.enseigne ?? c.code_centre;
  const addressParts = [c.street, c.street2, c.zip, c.ville, c.region, c.country].filter(Boolean);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F5F7] custom-scrollbar">
      <div className="mx-auto max-w-[1100px] space-y-4 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#332151] transition-colors hover:bg-slate-50"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#E34F2D]">Fiche du centre</p>
            <h2 className="truncate font-serif-mct text-lg font-bold text-[#332151]">{na(name)}</h2>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-[#332151]">
              {STATUT_LABEL[c.statut_ouverture] ?? na(c.statut_ouverture)}
            </span>
          </div>
        </div>

        {/* Informations (address folded in as the last row) */}
        <Section
          title="Informations"
          action={
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setEditOpen(true)}
                title="Modifier"
                aria-label="Modifier le centre"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#332151] transition-colors hover:border-[#E34F2D]/40 hover:text-[#E34F2D] cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                title="Supprimer"
                aria-label="Supprimer le centre"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#DF3714] transition-colors hover:border-[#DF3714]/30 hover:bg-[#DF3714]/5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
            <Field label="Code centre" value={<span className="font-mono">{na(c.code_centre)}</span>} />
            <Field label="Enseigne" value={na(c.enseigne)} />
            <Field label="Ville" value={na(c.ville)} />
            <Field label="Type de contrat" value={CONTRAT_LABEL[c.type_contrat] ?? na(c.type_contrat)} />
            <Field label="Activités" value={c.activites?.length ? c.activites.join(" · ") : "Non disponible"} />
            <Field label="Responsable" value={na(responsable)} />
            <Field label="Date de création" value={frDate(c.created_at)} />
            <Field label="Statut" value={STATUT_LABEL[c.statut_ouverture] ?? na(c.statut_ouverture)} />
          </div>
          <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Adresse</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[#332151]">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {addressParts.length ? addressParts.join(", ") : "Non disponible"}
              </p>
            </div>
            <button
              onClick={onViewOnMap}
              className="group inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-[#E34F2D]/10 px-4 py-2.5 text-xs font-bold text-[#E34F2D] transition-colors hover:bg-[#E34F2D]/20 sm:self-end"
            >
              <MapPin className="h-3.5 w-3.5" />
              Voir sur la carte MCT
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </Section>

        {/* Dossiers + Pièces side by side */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Section title={`Dossiers du centre (${detail.dossiers.length})`} className="lg:col-span-2">
            {detail.dossiers.length === 0 ? (
              <p className="text-sm font-medium text-[#5A5A7A]">Aucun dossier pour ce centre.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {detail.dossiers.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onOpenDossier?.(d.id)}
                    className="group flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors first:pt-0 last:pb-0 hover:text-[#E34F2D]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FolderOpen className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#E34F2D]" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#332151] group-hover:text-[#E34F2D]">
                          {STAGE_LABEL[d.etape_pipeline] ?? d.etape_pipeline}
                        </p>
                        <p className="text-[11px] text-[#5A5A7A]">{d.type_dossier} · créé le {frDate(d.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-[#332151]">
                        {STATUT_LABEL[d.statut_ouverture] ?? d.statut_ouverture}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#E34F2D]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Section>

          <Section title="Pièces">
            <div className="grid grid-cols-3 divide-x divide-slate-100">
              {[
                { label: "Présentes", value: detail.pieces_stats.present },
                { label: "Manquantes", value: detail.pieces_stats.missing },
                { label: "Validées", value: detail.pieces_stats.verified },
              ].map((s) => (
                <div key={s.label} className="px-1 text-center first:pl-0 last:pr-0">
                  <p className="text-xl font-bold tabular-nums text-[#332151]">{s.value}</p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[#5A5A7A]">{s.label}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Primary CTA — bottom right */}
        {detail.dossiers.length > 0 && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => onOpenDossier?.(detail.dossiers[detail.dossiers.length - 1].id)}
              className="group inline-flex items-center gap-2 rounded-xl bg-[#E34F2D] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#DF3714]"
            >
              Ouvrir le dossier
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </div>

      <CreateCentreModal
        open={editOpen}
        mode="edit"
        submitting={submitting}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        initial={{
          code_centre: c.code_centre,
          enseigne: c.enseigne ?? "",
          ville: c.ville ?? "",
          type_contrat: (c.type_contrat === "P" ? "P" : "R"),
          activites: c.activites ?? [],
          statut_ouverture: c.statut_ouverture,
          responsable: (c.contacts_clients?.responsable as string | undefined) ?? "",
          phone: (c.contacts_clients?.phone as string | undefined) ?? "",
          email: (c.contacts_clients?.email as string | undefined) ?? "",
          street: c.street ?? "",
          street2: c.street2 ?? "",
          zip: c.zip ?? "",
          region: c.region ?? "",
          country: c.country ?? "",
        }}
      />
    </div>
  );
}
