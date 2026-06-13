import { NextRequest, NextResponse } from "next/server";
import { supabaseFetch, hasSupabaseEnv } from "@/lib/server/supabase";
import { verifySession } from "@/lib/server/session";
import { SESSION_COOKIE } from "../auth/login/route";

// Server-side list of app users. The Léo backend exposes no list endpoint, so we
// read directly here with the server-held service key (same pattern as /api/audit-log).
//
// Source of truth for "who can log in" is Supabase Auth (auth.users), NOT the
// `profiles` table — a profile row only exists for users invited THROUGH this app,
// while accounts created directly in Auth have none. So we list Auth users and merge
// each one's app role (operateur/direction) from `profiles` when it exists.
export const dynamic = "force-dynamic";

interface AuthUser { id: string; email?: string | null; created_at?: string }

export async function GET(req: NextRequest) {
  const email = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!email) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase non configuré." }, { status: 500 });

  // Login accounts (Auth admin) + app roles (profiles), fetched in parallel.
  const [authRes, profRes] = await Promise.all([
    supabaseFetch("auth/v1/admin/users?per_page=1000"),
    supabaseFetch("rest/v1/profiles?select=id,role"),
  ]);
  if (!authRes.ok) {
    const detail = await authRes.text().catch(() => "");
    return NextResponse.json({ error: detail || "Échec du chargement des comptes." }, { status: authRes.status });
  }
  const authJson = await authRes.json().catch(() => ({}));
  const authUsers: AuthUser[] = Array.isArray(authJson?.users)
    ? authJson.users
    : Array.isArray(authJson)
      ? authJson
      : [];

  const profRows = profRes.ok ? await profRes.json().catch(() => []) : [];
  const roleById = new Map<string, string | null>(
    (Array.isArray(profRows) ? profRows : []).map((p: { id: string; role: string | null }) => [p.id, p.role]),
  );

  const users = authUsers
    // Hide the current user from their own directory — you can't remove your own access.
    .filter((u) => (u.email ?? "").toLowerCase() !== email.toLowerCase())
    .map((u) => ({
      id: u.id,
      email: u.email ?? null,
      role: roleById.get(u.id) ?? null,
      created_at: u.created_at ?? "",
    }));

  return NextResponse.json({ users, count: users.length });
}
