// Shared types and mock data for the Dossier Details view.

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

// ── Backend mapping (GET /api/centres/:id) ─────────────────────────────────────
const STATUT_PHASE_DD: Record<string, DossierDetail["phase"]> = {
  onboarding: "Onboarding",
  audit: "Dépôt",
  agrement_en_cours: "Dépôt",
  ouvert: "Ouvert",
  bloque: "Onboarding"
};

interface CentreDetailApi {
  centre?: {
    id: string;
    code_centre?: string;
    enseigne?: string | null;
    ville?: string | null;
    statut_ouverture?: string;
    street?: string | null;
    zip?: string | null;
    contacts_clients?: Record<string, unknown>;
  };
  dossiers?: { created_at?: string }[];
  presentPieces?: string[];
  missingPieces?: string[];
  pieces_stats?: { present: number; missing: number; verified: number };
  messages?: { sender: string; contenu: string; received_at: string }[];
}

/** Map the COMPLETE centre detail (GET /api/centres/:id) → the detail-drawer shape. */
export function centreDetailToDossier(data: CentreDetailApi): DossierDetail {
  const c = data.centre ?? ({} as NonNullable<CentreDetailApi["centre"]>);
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
      type: m.sender === "leo" ? "ai" : "user"
    }))
  };
}
