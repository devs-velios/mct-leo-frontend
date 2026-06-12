// Direction heat-map feature — shared types. Mirrors GET /api/dashboard/pipeline-heatmap.
// The « Vue Direction » matrix: rows = dossiers, columns = pipeline phases, each cell
// coloured by how long the dossier has spent in that phase (green / orange / red).

/** A column of the matrix — comes from the live phase catalog (already ordered). */
export interface HeatmapPhase {
  name: string; // slug id (used as the cells key)
  label: string; // FR display name
  order: number; // 1-based column position
}

export type HeatmapColor = "green" | "orange" | "red";

/** One cell: how long the dossier spent in a phase, and whether it's the current one. */
export interface HeatmapCell {
  days: number;
  color: HeatmapColor;
  /** The phase the dossier is in right now (still counting) — highlight it. */
  current: boolean;
}

/** Centre summary joined onto each dossier row. */
export interface HeatmapCentreRef {
  id: string;
  code_centre: string;
  enseigne: string | null;
  ville: string | null;
}

/** One dossier row. `cells` is keyed by phase `name`; a missing key = phase never entered. */
export interface HeatmapRow {
  dossier_id: string;
  centre: HeatmapCentreRef;
  current_phase: string;
  macro_statut: string;
  total_days: number;
  cells: Record<string, HeatmapCell>;
}

/** Day thresholds: < orange → green, ≥ orange → orange, ≥ red → red. */
export interface HeatmapThresholds {
  orange_days: number;
  red_days: number;
}

export interface PipelineHeatmap {
  phases: HeatmapPhase[];
  thresholds: HeatmapThresholds;
  rows: HeatmapRow[];
}

/** Optional query params (in days). Omitted → backend defaults (7 / 14). */
export interface HeatmapQuery {
  orange_days?: number;
  red_days?: number;
}

export const DEFAULT_HEATMAP_THRESHOLDS: HeatmapThresholds = { orange_days: 7, red_days: 14 };

export interface HeatmapState {
  data: PipelineHeatmap | null;
  /** The thresholds currently applied (mirrors the response, drives the query). */
  thresholds: HeatmapThresholds;
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
}
