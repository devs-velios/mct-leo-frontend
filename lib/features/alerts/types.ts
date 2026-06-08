// Alerts feature — shared types. Mirrors GET /api/alerts.

export interface Alert {
  id: string;
  centre_id: string;
  dossier_id: string | null;
  type: string;
  message: string;
  status: "open" | "resolved";
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  // Enriched centre fields the backend joins onto the row (optional/defensive).
  code_centre?: string | null;
  enseigne?: string | null;
  ville?: string | null;
}

export type AlertStatusFilter = "open" | "resolved";

export type FetchStatus = "idle" | "loading" | "loaded" | "error";

export interface AlertsState {
  alerts: Alert[];
  count: number;
  status: FetchStatus;
  error: string | null;
}
