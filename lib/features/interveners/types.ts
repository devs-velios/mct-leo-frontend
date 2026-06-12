// Interveners (internal whitelist) feature — shared types. Mirrors /api/interveners.
// These are internal MCT staff: the list drives who's added to a centre's WhatsApp
// group and who gets notified. This screen just manages the list (full CRUD).

export interface Intervener {
  id: string;
  /** E.164-ish, unique. Stored normalized (spaces/dots/dashes stripped). */
  phone_number: string;
  name: string;
  role: string | null;
  /** Routing category (see INTERVENER_CATEGORIES). */
  category: string;
  /** Department codes covered, e.g. ["13","83","2A"]. */
  sectors: string[];
  activities: string[]; // ["VL","CL","PL"]
  created_at: string;
}

export interface IntervenersListResponse {
  interveners: Intervener[];
  categories: string[];
}

/** A routing category from GET /api/interveners/categories (value + helper text). */
export interface IntervenerCategory {
  value: string;
  description: string;
}

export interface IntervenerCategoriesResponse {
  categories: IntervenerCategory[];
}

export interface CreateIntervenerPayload {
  phone_number: string;
  name: string;
  role?: string;
  category?: string;
  sectors?: string[];
  activities?: string[];
}

export type UpdateIntervenerPayload = Partial<CreateIntervenerPayload>;

// Display labels for the routing categories.
export const CATEGORY_LABEL: Record<string, string> = {
  always: "Toujours",
  always_r: "Toujours (contrats R)",
  commercial: "Commercial",
  auditeur: "Auditeur",
  technique: "Technique",
};

export const ACTIVITY_VALUES = ["VL", "CL", "PL"] as const;

export interface IntervenersState {
  list: Intervener[];
  categories: string[];
  /** Detailed categories (value + description) from /interveners/categories. */
  categoryOptions: IntervenerCategory[];
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
}
