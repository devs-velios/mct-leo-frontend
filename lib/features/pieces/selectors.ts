// Pieces feature — view-model mapping + domain selectors. The backend→view
// transforms (validation queue / raw piece → ValidationItem), the piece-type
// vocabulary, the confidence thresholds, and the validation filters live here so
// the Validations view stays presentational.

import { type Piece, type QueuePiece } from "./types";

// ── Validation view-model ──────────────────────────────────────────────────────
export interface ValidationItem {
  id: number;
  pieceId?: string; // backend piece UUID (used for verify/reject API calls)
  centreId?: string; // backend centre UUID (used to open the centre detail)
  driveLink?: string | null;
  code: string;
  nom: string;
  detail: string;
  ville?: string | null; // centre city (own column + city filter)
  docType: string;
  fileName?: string | null; // the linked uploaded file name
  status: "À identifier" | "À valider" | "Validé" | "Rejeté";
  confIA: number;
  recuLe: string;
  createdAt?: string; // raw ISO (for the date filter)
  rejetRaison?: string | null; // rejection reason, when rejected
  hasDrive: boolean;
}

const STATUT_LABEL: Record<string, ValidationItem["status"]> = {
  a_identifier: "À identifier",
  a_valider: "À valider",
  valide: "Validé",
  rejete: "Rejeté",
};

const frDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * Resolve a piece's display status from the source-of-truth flags first:
 * a human-validated piece is "Validé" even if previously rejected; a piece with a
 * rejection reason (and not validated) is "Rejeté". Otherwise fall back to statut.
 */
function resolveStatus(q: { valide_par_humain?: boolean; rejet_raison?: string | null; statut: string }): ValidationItem["status"] {
  if (q.valide_par_humain) return "Validé";
  if (q.rejet_raison) return "Rejeté";
  return STATUT_LABEL[q.statut] ?? "À identifier";
}

/** Map a backend /api/pieces/queue item → the ValidationItem the view renders. */
export function queueItemToValidation(q: QueuePiece, index: number): ValidationItem {
  return {
    id: index + 1,
    pieceId: q.id,
    centreId: q.centre_id ?? undefined,
    driveLink: q.drive_link,
    code: q.code_centre ?? "—",
    nom: q.enseigne ?? q.code_centre ?? "—",
    detail: [q.enseigne, q.ville].filter(Boolean).join(" — "),
    ville: q.ville ?? null,
    docType: q.type_piece,
    fileName: q.nom_fichier,
    status: resolveStatus(q),
    confIA: Math.round((q.confiance ?? 0) * 100),
    recuLe: frDateTime(q.created_at),
    createdAt: q.created_at,
    rejetRaison: q.rejet_raison ?? null,
    hasDrive: Boolean(q.drive_link),
  };
}

// Centre fields the backend joins onto a dossier — used to label a piece's row.
export interface PieceCentreRef {
  code_centre?: string | null;
  enseigne?: string | null;
  ville?: string | null;
}

/**
 * Map a real backend piece (GET /api/pieces) → the ValidationItem the view renders.
 * `centre` is resolved by the caller from the piece's dossier_id. Status is derived
 * since the backend models validation as a boolean + optional rejection reason.
 */
export function pieceToValidation(p: Piece, index: number, centre?: PieceCentreRef): ValidationItem {
  const conf = p.confiance_classification ?? 0;
  const status: ValidationItem["status"] = p.valide_par_humain
    ? "Validé"
    : p.rejet_raison
      ? "Rejeté"
      : conf >= 0.7
        ? "À valider"
        : "À identifier";
  return {
    id: index + 1,
    pieceId: p.id,
    driveLink: p.drive_link,
    code: centre?.code_centre ?? "—",
    nom: centre?.enseigne ?? centre?.code_centre ?? "—",
    detail: [centre?.enseigne, centre?.ville].filter(Boolean).join(" — "),
    ville: centre?.ville ?? null,
    docType: p.type_piece,
    fileName: p.nom_fichier_origine ?? p.nom_fichier_canonique,
    status,
    confIA: Math.round(conf * 100),
    recuLe: frDateTime(p.created_at),
    createdAt: p.created_at,
    rejetRaison: p.rejet_raison ?? null,
    hasDrive: Boolean(p.drive_link),
  };
}

// ── Piece-type vocabulary (mirrors the backend PIECE_TYPES) ────────────────────
const DOC_LABEL: Record<string, string> = {
  kbis: "Kbis",
  rapport_audit_initial: "Rapport d'audit initial",
  plan_masse: "Plan de masse",
  cadastre: "Cadastre",
  liasse: "Liasse fiscale",
  manuel_procedures: "Manuel de procédures",
  attestation_conformite_logiciel: "Attestation conformité logiciel",
  piece_identite_exploitant: "Pièce d'identité (exploitant)",
  attestation_formation_exploitant: "Attestation de formation (exploitant)",
  piece_identite_responsable_legal: "Pièce d'identité (responsable légal)",
  recepisse_cofrac: "Récépissé COFRAC",
  references_techniques: "Références techniques",
  attestation_voirie_lourde: "Attestation voirie lourde",
  attestation_planeite: "Attestation de planéité",
  agrement_prefectoral: "Agrément préfectoral",
  assurance: "Assurance",
  piece_identite: "Pièce d'identité",
  autre: "Autre",
};

/** Human-readable label for a piece type (humanized fallback for unknown codes). */
export const pieceTypeLabel = (t?: string) =>
  !t ? "—" : DOC_LABEL[t] ?? t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

// ── Piece categories (for grouping the document checklist) ─────────────────────
const PIECE_CATEGORY: Record<string, string> = {
  kbis: "Société & légal",
  liasse: "Société & légal",
  piece_identite: "Identité",
  piece_identite_exploitant: "Identité",
  piece_identite_responsable_legal: "Identité",
  attestation_formation_exploitant: "Identité",
  plan_masse: "Site & plans",
  cadastre: "Site & plans",
  attestation_voirie_lourde: "Site & plans",
  attestation_planeite: "Site & plans",
  manuel_procedures: "Technique & conformité",
  attestation_conformite_logiciel: "Technique & conformité",
  references_techniques: "Technique & conformité",
  recepisse_cofrac: "Technique & conformité",
  rapport_audit_initial: "Audit & agrément",
  agrement_prefectoral: "Audit & agrément",
  assurance: "Assurance",
  autre: "Autre",
};

/** Stable display order for the checklist categories. */
export const PIECE_CATEGORY_ORDER = [
  "Société & légal",
  "Identité",
  "Site & plans",
  "Technique & conformité",
  "Audit & agrément",
  "Assurance",
  "Autre",
];

/** Category a piece type belongs to (falls back to "Autre"). */
export const pieceCategory = (t?: string) => (t && PIECE_CATEGORY[t]) || "Autre";

// Reasons offered in the rejection modal dropdown.
export const REJECT_REASONS = [
  "Document non conforme ou illisible",
  "Signature manquante",
  "Date de validité dépassée",
  "Pièce d'identité expirée",
  "Autre motif technique",
];

// ── Validation filters + eligibility rules ─────────────────────────────────────
export const CONF_HIGH = 90; // "fiable" / high-confidence threshold (%)
export const CONF_LOW = 70; // "faible" / low-confidence threshold (%)

export type ConfFilter = "all" | "high" | "low";

/** Apply the free-text search + status tab + confidence band to the queue rows. */
export function filterValidations(
  items: ValidationItem[],
  opts: { search?: string; statuts?: string[]; confs?: string[]; docTypes?: string[] },
): ValidationItem[] {
  const { search = "", statuts = [], confs = [], docTypes = [] } = opts;
  const query = search.trim().toLowerCase();
  return items.filter((item) => {
    if (statuts.length > 0 && !statuts.includes(item.status)) return false;
    if (docTypes.length > 0 && !docTypes.includes(item.docType)) return false;
    if (confs.length > 0) {
      const hi = confs.includes("high") && item.confIA >= CONF_HIGH;
      const lo = confs.includes("low") && item.confIA < CONF_LOW;
      if (!hi && !lo) return false;
    }
    if (query) {
      const hit =
        item.code.toLowerCase().includes(query) ||
        item.nom.toLowerCase().includes(query) ||
        item.detail.toLowerCase().includes(query);
      if (!hit) return false;
    }
    return true;
  });
}

/** Pending pieces eligible for bulk validation: AI confidence ≥ 90% and not yet decided. */
export function highConfidencePending(items: ValidationItem[]): ValidationItem[] {
  return items.filter(
    (v) => v.pieceId && v.confIA >= CONF_HIGH && (v.status === "À valider" || v.status === "À identifier"),
  );
}
