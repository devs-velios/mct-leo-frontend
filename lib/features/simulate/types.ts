// Simulate feature — shared types. Mirrors POST /api/simulate/* (dev/demo endpoints,
// disabled when SIMULATE_ENABLED=false on the backend → 404).

export interface OdooSimulationPayload {
  contract_id: string;
  code_centre: string;
  type: "R" | "P";
  activities: string[];
  enseigne?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  street?: string;
  street2?: string;
  zip?: string;
  city?: string;
  region?: string;
  country?: string;
}

export interface SimulateOdooResult {
  message?: string;
  data?: { status: string; centre_id: string; dossier_id: string };
}

export type RunStatus = "idle" | "loading" | "success" | "error";

export interface SimulateState {
  status: RunStatus;
  result: SimulateOdooResult | null;
  error: string | null;
}
