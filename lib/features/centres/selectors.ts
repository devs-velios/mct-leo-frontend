// Centres feature — view-model mapping + domain selectors. The backend→view
// transforms (centre detail → dossier drawer, centre row → dashboard row) and the
// centres list filter live here so the views stay presentational.

import { type CentreDetail, type CentreListItem } from "./types";

// ── Centres list filter (statut + activités + free-text) ───────────────────────
export function filterCentres(
  centres: CentreListItem[],
  opts: { search?: string; statut?: string[]; activites?: string[]; villes?: string[] },
): CentreListItem[] {
  const { search = "", statut = [], activites = [], villes = [] } = opts;
  const q = search.trim().toLowerCase();
  return centres.filter((c) => {
    if (statut.length > 0 && !statut.includes(c.statut_ouverture)) return false;
    if (activites.length > 0 && !(c.activites ?? []).some((a) => activites.includes(a))) return false;
    if (villes.length > 0 && !villes.includes(c.ville ?? "")) return false;
    if (!q) return true;
    return [c.code_centre, c.enseigne, c.ville].some((x) => (x ?? "").toLowerCase().includes(q));
  });
}

// ── Detail drawer view-model (GET /api/centres/:id → dossier detail) ───────────
export interface Message {
  sender: string;
  text: string;
  time: string;
  type: "ai" | "user" | "operator";
}

export interface DossierDetail {
  id: string;
  code?: string; // human-friendly code_centre (never show the raw UUID id)
  centre: string;
  ville: string;
  gerant: string;
  phase: "Signature" | "Onboarding" | "Dépôt" | "Ouvert" | "Suivi qualité";
  joursInactif: number;
  contact: string;
  email: string;
  siret: string;
  denomination: string;
  adresse: string;
  signatureDate: string;
  ouvertureDate: string;
  enseigne: "Norauto" | "Speedy" | "Feu Vert" | "Indépendant";
  completude: number;
  documents: {
    kbis: "validé" | "manquant" | "en_cours";
    assurance: "validé" | "manquant" | "en_cours";
    identite: "validé" | "manquant" | "en_cours";
  };
  presentPieces?: string[];
  missingPieces?: string[];
  messages: Message[];
}

const STATUT_PHASE_DD: Record<string, DossierDetail["phase"]> = {
  onboarding: "Onboarding",
  audit: "Dépôt",
  agrement_en_cours: "Dépôt",
  ouvert: "Ouvert",
  bloque: "Onboarding",
};

/** Map the COMPLETE centre detail (GET /api/centres/:id) → the detail-drawer shape. */
export function centreDetailToDossier(data: CentreDetail): DossierDetail {
  const c = data.centre ?? ({} as CentreDetail["centre"]);
  const contacts = (c.contacts_clients ?? {}) as Record<string, unknown>;
  const vals = Object.values(contacts).filter((v): v is string => typeof v === "string");
  const phone = vals.find((v) => /\d{8,}/.test(v.replace(/\D/g, ""))) ?? "";
  const email = vals.find((v) => v.includes("@")) ?? "";
  const present = data.presentPieces ?? [];
  const totalExpected = present.length + (data.missingPieces?.length ?? 0);
  const completude = totalExpected ? Math.round((present.length / totalExpected) * 100) : 0;
  const doc = (key: string): "validé" | "manquant" => (present.includes(key) ? "validé" : "manquant");
  return {
    id: c.id ?? "",
    code: c.code_centre,
    centre: c.enseigne ?? c.code_centre ?? "—",
    ville: c.ville ?? "",
    gerant: "",
    phase: STATUT_PHASE_DD[c.statut_ouverture ?? ""] ?? "Onboarding",
    joursInactif: 0,
    contact: phone,
    email,
    siret: "",
    denomination: c.enseigne ?? "",
    adresse: [c.street, c.zip, c.ville].filter(Boolean).join(", "),
    signatureDate: data.dossiers?.[0]?.created_at ? new Date(data.dossiers[0].created_at).toLocaleDateString("fr-FR") : "—",
    ouvertureDate: "—",
    enseigne: "Indépendant",
    completude,
    documents: { kbis: doc("kbis"), assurance: doc("attestation_conformite_logiciel"), identite: doc("piece_identite_exploitant") },
    presentPieces: present,
    missingPieces: data.missingPieces ?? [],
    messages: (data.messages ?? []).map((m) => ({
      sender: m.sender === "leo" ? "Léo" : "Client",
      text: m.contenu,
      time: new Date(m.received_at).toLocaleString("fr-FR"),
      type: m.sender === "leo" ? "ai" : "user",
    })),
  };
}

// ── Dashboard table view-model (GET /api/centres → "centres à traiter" row) ────
export interface DashboardDossier {
  id: string;
  code?: string; // human-friendly code_centre (never show the raw UUID id)
  enseigne: string;
  ville: string;
  gerant: string;
  phase: string;
  joursInactif: number;
  statut: string;
  contact: string;
}

const STATUT_PHASE_DASH: Record<string, string> = {
  onboarding: "Onboarding",
  audit: "Audit",
  agrement_en_cours: "Dépôt Agrément",
  ouvert: "Ouvert",
  bloque: "Bloqué",
};

function firstPhone(contacts: unknown): string {
  if (!contacts || typeof contacts !== "object") return "";
  for (const v of Object.values(contacts as Record<string, unknown>)) {
    if (typeof v === "string" && /\d{8,}/.test(v.replace(/[\s.\-()]/g, ""))) return v;
  }
  return "";
}

/** Map a backend centre list row → the dashboard "centres à traiter" table row. */
export function centreToDashboardRow(c: CentreListItem): DashboardDossier {
  const days = c.last_activity_at
    ? Math.max(0, Math.floor((Date.now() - new Date(c.last_activity_at).getTime()) / 86_400_000))
    : 0;
  return {
    id: c.id,
    code: c.code_centre,
    enseigne: c.enseigne ?? c.code_centre,
    ville: c.ville ?? "",
    gerant: "",
    phase: STATUT_PHASE_DASH[c.statut_ouverture] ?? "Onboarding",
    joursInactif: days,
    statut: days >= 5 ? "critique" : "normal",
    contact: firstPhone(c.contacts_clients),
  };
}
