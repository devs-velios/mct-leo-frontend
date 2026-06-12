// Audit log feature — shared types. Mirrors the public.audit_log table
// (GET /api/audit-log). Append-only history of every actor action on an entity.

export interface AuditLogEntry {
  id: string;
  /** Who acted (e.g. "operateur", "client", "leo", "system"). */
  actor_type: string;
  actor_id: string | null;
  /** The action performed (free text, e.g. "centre.update", "piece.validate"). */
  action: string;
  /** What was acted on. */
  entity_type: string;
  entity_id: string;
  /**
   * State before / after the change. Supabase returns these as JSON *strings*
   * (e.g. "{\"drive_path\": \"03_Plans\"}"), so the view parses defensively.
   */
  payload_avant: string | Record<string, unknown> | null;
  payload_apres: string | Record<string, unknown> | null;
  created_at: string;
}

export interface AuditLogParams {
  limit?: number;
  offset?: number;
  /** Optional filter to a single entity's history. */
  entity_type?: string;
  entity_id?: string;
}

export type AuditStatus = "idle" | "loading" | "loaded" | "error";
