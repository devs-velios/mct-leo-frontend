// Audit log feature — network layer (read-only, server-paginated).
//
// Unlike the other features, this one does NOT go through the Léo backend. It hits
// the same-origin Next route /api/audit-log, which queries Supabase directly with
// the server-held service key — so the Supabase URL / key never reach the browser.

import { type AuditLogEntry, type AuditLogParams } from "./types";

export async function fetchAuditLog(params: AuditLogParams = {}): Promise<{ entries: AuditLogEntry[]; count: number }> {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit ?? 20));
  if (params.offset) qs.set("offset", String(params.offset));
  if (params.entity_type) qs.set("entity_type", params.entity_type);
  if (params.entity_id) qs.set("entity_id", params.entity_id);

  const res = await fetch(`/api/audit-log?${qs.toString()}`, { credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error ?? `Échec du chargement du journal (${res.status})`);
  }
  const entries: AuditLogEntry[] = data.entries ?? [];
  const count: number = data.count ?? entries.length;
  return { entries, count };
}
