// Dashboard feature — shared types.

export interface DashboardStats {
  centres: { total: number; by_statut: Record<string, number> };
  dossiers: { total: number; by_stage: Record<string, number> };
  open_alerts: number;
  pending_reminders: number;
  pieces: { total: number; verified: number };
}

export type DashboardStatus = "idle" | "loading" | "loaded" | "error";

export interface DashboardState {
  stats: DashboardStats | null;
  status: DashboardStatus;
  error: string | null;
}
