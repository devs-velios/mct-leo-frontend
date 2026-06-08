// Types and mock data for the Validations view.

import { type Piece } from "@/lib/features/pieces";

export interface ValidationItem {
  id: number;
  pieceId?: string; // backend piece UUID (used for verify/reject API calls)
  centreId?: string; // backend centre UUID (used to open the centre detail)
  driveLink?: string | null;
  code: string;
  nom: string;
  detail: string;
  docType: string;
  status: "À identifier" | "À valider" | "Validé" | "Rejeté";
  confIA: number;
  recuLe: string;
  createdAt?: string; // raw ISO (for the date filter)
  rejetRaison?: string | null; // rejection reason, when rejected
  hasDrive: boolean;
}

// ── Backend mapping ───────────────────────────────────────────────────────────
const STATUT_LABEL: Record<string, ValidationItem["status"]> = {
  a_identifier: "À identifier",
  a_valider: "À valider",
  valide: "Validé",
  rejete: "Rejeté"
};

interface QueueItem {
  id: string;
  type_piece: string;
  nom_fichier: string | null;
  confiance: number | null;
  drive_link: string | null;
  created_at: string;
  statut: string;
  valide_par_humain?: boolean;
  rejet_raison?: string | null;
  centre_id?: string | null;
  code_centre: string | null;
  enseigne: string | null;
  ville: string | null;
}

/**
 * Resolve a piece's display status from the source-of-truth flags first:
 * a human-validated piece is "Validé" even if it was previously rejected; a piece with a
 * rejection reason (and not validated) is "Rejeté". Otherwise fall back to the derived statut.
 */
function resolveStatus(q: { valide_par_humain?: boolean; rejet_raison?: string | null; statut: string }): ValidationItem["status"] {
  if (q.valide_par_humain) return "Validé";
  if (q.rejet_raison) return "Rejeté";
  return STATUT_LABEL[q.statut] ?? "À identifier";
}

/** Map a backend /api/pieces/queue item to the ValidationItem shape the view renders. */
export function queueItemToValidation(q: QueueItem, index: number): ValidationItem {
  return {
    id: index + 1,
    pieceId: q.id,
    centreId: q.centre_id ?? undefined,
    driveLink: q.drive_link,
    code: q.code_centre ?? "—",
    nom: q.enseigne ?? q.code_centre ?? "—",
    detail: [q.enseigne, q.ville].filter(Boolean).join(" — "),
    docType: q.type_piece,
    status: resolveStatus(q),
    confIA: Math.round((q.confiance ?? 0) * 100),
    recuLe: new Date(q.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    createdAt: q.created_at,
    rejetRaison: q.rejet_raison ?? null,
    hasDrive: Boolean(q.drive_link)
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
 * `centre` is resolved by the caller from the piece's dossier_id (the pieces list
 * endpoint doesn't embed the centre). Status is derived since the backend models
 * validation as a boolean + optional rejection reason rather than a status enum.
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
    docType: p.type_piece,
    status,
    confIA: Math.round(conf * 100),
    recuLe: new Date(p.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    createdAt: p.created_at,
    rejetRaison: p.rejet_raison ?? null,
    hasDrive: Boolean(p.drive_link),
  };
}

export const initialValidations: ValidationItem[] = [
  { id: 1, code: "TST70406", nom: "Test copy Léo — Imrane", detail: "Mon Contrôle Technique Copy - TestCopy", docType: "Kbis", status: "À identifier", confIA: 95, recuLe: "13 Mai, 16:53", hasDrive: true },
  { id: 2, code: "LEORAG01", nom: "TEST RAG LED 76VESA", detail: "Mon Contrôle Technique TEST LEO CARDONNAY - Test", docType: "Assurance", status: "À identifier", confIA: 95, recuLe: "13 Mai, 02:15", hasDrive: true },
  { id: 3, code: "LEORAG01", nom: "TEST RAG LED 76VESA", detail: "Mon Contrôle Technique TEST LEO CARDONNAY - Test", docType: "Pièce ID", status: "À identifier", confIA: 95, recuLe: "13 Mai, 01:53", hasDrive: true },
  { id: 4, code: "LEORAG01", nom: "TEST RAG LED 76VESA", detail: "Mon Contrôle Technique TEST LEO CARDONNAY - Test", docType: "Kbis", status: "À identifier", confIA: 95, recuLe: "13 Mai, 01:39", hasDrive: true },
  { id: 5, code: "LEORAG01", nom: "TEST RAG LED 76VESA", detail: "Mon Contrôle Technique TEST LEO CARDONNAY - Test", docType: "Assurance", status: "À identifier", confIA: 95, recuLe: "13 Mai, 01:35", hasDrive: true },
  { id: 6, code: "ODO22", nom: "Opportunité de Phillipe Sarlin", detail: "Mon Contrôle Technique OPPORTUNITÉ DE PHILLIPE SARLIN", docType: "Pièce ID", status: "À identifier", confIA: 30, recuLe: "07 Mai, 13:49", hasDrive: false },
  { id: 7, code: "60KABO", nom: "Bourama KAMISSOKO", detail: "Mon Contrôle Technique Bornel - Bornel", docType: "Kbis", status: "À identifier", confIA: 90, recuLe: "06 Mai, 18:43", hasDrive: false },
  { id: 8, code: "60KABO", nom: "Bourama KAMISSOKO", detail: "Mon Contrôle Technique Bornel - Bornel", docType: "Assurance", status: "À identifier", confIA: 98, recuLe: "06 Mai, 05:00", hasDrive: true },
  { id: 9, code: "60KABO", nom: "Bourama KAMISSOKO", detail: "Mon Contrôle Technique Bornel - Bornel", docType: "Pièce ID", status: "À identifier", confIA: 98, recuLe: "06 Mai, 04:45", hasDrive: false },
  { id: 10, code: "60KABO", nom: "Bourama KAMISSOKO", detail: "Mon Contrôle Technique Bornel - Bornel", docType: "Kbis", status: "À identifier", confIA: 30, recuLe: "06 Mai, 04:41", hasDrive: false },
  { id: 11, code: "60KABO", nom: "Bourama KAMISSOKO", detail: "Mon Contrôle Technique Bornel - Bornel", docType: "Assurance", status: "À identifier", confIA: 98, recuLe: "06 Mai, 04:39", hasDrive: false },
  { id: 12, code: "60KABO", nom: "Bourama KAMISSOKO", detail: "Mon Contrôle Technique Bornel - Bornel", docType: "Pièce ID", status: "À identifier", confIA: 85, recuLe: "06 Mai, 04:31", hasDrive: false },
  { id: 13, code: "60KABO", nom: "Bourama KAMISSOKO", detail: "Mon Contrôle Technique Bornel - Bornel", docType: "Kbis", status: "À identifier", confIA: 98, recuLe: "06 Mai, 04:25", hasDrive: false },
  { id: 14, code: "60KABO", nom: "Bourama KAMISSOKO", detail: "Mon Contrôle Technique Bornel - Bornel", docType: "Assurance", status: "À identifier", confIA: 30, recuLe: "06 Mai, 04:14", hasDrive: false },
  { id: 15, code: "60KABO", nom: "Bourama KAMISSOKO", detail: "Mon Contrôle Technique Bornel - Bornel", docType: "Pièce ID", status: "À identifier", confIA: 30, recuLe: "06 Mai, 04:08", hasDrive: true },
  { id: 16, code: "60KABO", nom: "Bourama KAMISSOKO", detail: "Mon Contrôle Technique Bornel - Bornel", docType: "Kbis", status: "À identifier", confIA: 30, recuLe: "06 Mai, 04:08", hasDrive: false }
];

// Reasons offered in the rejection modal dropdown.
export const REJECT_REASONS = [
  "Document non conforme ou illisible",
  "Signature manquante",
  "Date de validité dépassée",
  "Pièce d'identité expirée",
  "Autre motif technique"
];
