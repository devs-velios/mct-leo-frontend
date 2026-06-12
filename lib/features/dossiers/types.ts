// Dossiers feature — shared types. Mirrors GET /api/dossiers and /api/dossiers/:id.

export interface DossierCentreRef {
  id: string;
  code_centre: string;
  enseigne: string | null;
  ville: string | null;
  statut_ouverture: string;
}

// One row of the pipeline board (GET /api/dossiers).
export interface DossierListItem {
  id: string;
  etape_pipeline: string;
  type_dossier?: string;
  created_at: string;
  centre: DossierCentreRef | null;
}

// Single dossier with navigation hints (GET /api/dossiers/:id).
export interface DossierDetail {
  id: string;
  centre_id: string;
  etape_pipeline: string;
  statut_ouverture: string;
  next_stage: string | null;
  prev_stage: string | null;
}

export interface AdvancePayload {
  direction?: "next" | "back";
  target?: string;
}

// Pipeline view-model row — derived from a DossierListItem (see selectors.dossierToRow)
// for the tables/boards. Never expose the raw UUID id; navigate by centre id.
export interface Dossier {
  id: string;
  code?: string; // human-friendly code_centre (never show the raw UUID id)
  centre: string;
  ville: string;
  gerant: string;
  phase: "Signature" | "Onboarding" | "Dépôt" | "Ouvert" | "Suivi qualité";
  joursInactif: number;
  signatureDate: string;
  ouvertureDate: string;
  enseigne: "Norauto" | "Speedy" | "Feu Vert" | "Indépendant";
  contact: string;
  dossierId?: string; // real dossier UUID (for advance-stage)
  etape?: string; // micro status (etape_pipeline)
  macro?: string; // macro status (statut_ouverture)
  // ── Enriched fields (joined in the view from the centres list + pipeline catalog) ──
  typeDossier?: string; // "centre" | "controleur" — tells the centre dossier apart from controller dossiers
  typeContrat?: string; // R / P
  activites?: string[]; // VL / CL / PL
  responsableRole?: string | null; // owning role for the current phase
  nbDossiers?: number; // total dossiers held by the centre
}

export type FetchStatus = "idle" | "loading" | "loaded" | "error";

export interface DossiersState {
  list: DossierListItem[];
  count: number;
  status: FetchStatus;
  error: string | null;
}
