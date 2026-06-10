// Pipeline catalog feature — shared types. Mirrors /api/dossiers/pipeline.
// The catalog is the single source of truth for the kanban columns / phase pickers:
// build them from `phases` (already sorted by `order`) — never hardcode phase names.

export interface PipelinePhase {
  /** Stable slug id — use as the key and in advance-stage. */
  name: string;
  /** Human display name (FR) — show this to users. */
  label: string;
  /** 1-based column position. */
  order: number;
  /** The macro centre badge this phase rolls up to (one of macro_options). */
  macro_statut: string;
  /** The role that owns the phase. */
  responsable_role: string | null;
}

export interface PipelineCatalog {
  phases: PipelinePhase[];
  /** Allowed values for `macro_statut` (populate the macro dropdown from this). */
  macro_options: string[];
}

// The macro badge set is fixed backend-side (MACRO_OPTIONS in pipeline.service.ts) and
// is NOT editable — `ouvert`/`bloque` are managed by other flows. We seed state with it
// so the macro dropdown works even before GET /pipeline resolves; the GET overwrites it
// with the authoritative list (same values).
export const DEFAULT_MACRO_OPTIONS = ["onboarding", "audit", "agrement_en_cours"];

export interface AddPhasePayload {
  label: string;
  macro_statut: string;
  step_order?: number;
  responsable_role?: string;
  slug?: string;
}

export interface EditPhasePayload {
  label?: string;
  macro_statut?: string;
  step_order?: number;
}

// Allowed `responsable_role` values accepted by the backend.
export const RESPONSABLE_ROLES = [
  { value: "operateur_vl_cl", label: "Opérateur VL / CL" },
  { value: "referent_pl", label: "Référent PL" },
  { value: "commercial", label: "Commercial" },
  { value: "auditeur", label: "Auditeur" },
  { value: "dreal", label: "DREAL" },
] as const;

export interface PipelineState {
  phases: PipelinePhase[];
  macroOptions: string[];
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
}
