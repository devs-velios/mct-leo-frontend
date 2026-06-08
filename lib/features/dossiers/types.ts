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

export type FetchStatus = "idle" | "loading" | "loaded" | "error";

export interface DossiersState {
  list: DossierListItem[];
  count: number;
  status: FetchStatus;
  error: string | null;
}
