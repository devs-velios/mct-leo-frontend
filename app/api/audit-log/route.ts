import { NextRequest, NextResponse } from "next/server";
import { supabaseFetch, hasSupabaseEnv } from "@/lib/server/supabase";
import { verifySession } from "@/lib/server/session";
import { SESSION_COOKIE } from "../auth/login/route";

// Server-side proxy for the audit_log table. The browser calls
//   GET /api/audit-log?limit=&offset=&entity_type=&entity_id=
// and we query Supabase PostgREST here with the server-held service key, so the
// Supabase URL / key never reach the client. Returns { entries, count }.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Auth gate — same signed-session cookie as the rest of the app.
  const email = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!email) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase non configuré." }, { status: 500 });

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Math.max(Number(sp.get("limit") ?? 20) || 20, 1), 200);
  const offset = Math.max(Number(sp.get("offset") ?? 0) || 0, 0);
  const entityType = sp.get("entity_type");
  const entityId = sp.get("entity_id");

  // PostgREST query: newest first, server-paginated, optional single-entity filter.
  const q = new URLSearchParams();
  q.set("select", "*");
  q.set("order", "created_at.desc");
  q.set("limit", String(limit));
  q.set("offset", String(offset));
  if (entityType) q.set("entity_type", `eq.${entityType}`);
  if (entityId) q.set("entity_id", `eq.${entityId}`);

  const res = await supabaseFetch(`rest/v1/audit_log?${q.toString()}`, {
    headers: { Prefer: "count=exact" }, // exposes the total in the content-range header
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return NextResponse.json({ error: detail || "Échec de la requête Supabase." }, { status: res.status });
  }

  const entries = await res.json().catch(() => []);
  // content-range looks like "0-19/12345" → the total is after the slash.
  const total = Number((res.headers.get("content-range") ?? "").split("/")[1]);
  const count = Number.isFinite(total) ? total : Array.isArray(entries) ? entries.length : 0;

  return NextResponse.json({ entries, count });
}
