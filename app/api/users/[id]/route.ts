import { NextRequest, NextResponse } from "next/server";
import { supabaseFetch, hasSupabaseEnv } from "@/lib/server/supabase";
import { verifySession } from "@/lib/server/session";
import { SESSION_COOKIE } from "../../auth/login/route";

// Remove an app user's access. The Léo backend exposes no delete endpoint, so we
// revoke here with the server-held service key (same pattern as /api/audit-log):
//   1. delete the Supabase auth user → they can no longer log in;
//   2. delete their `profiles` row → drops their role record (if any).
// Guards: session-gated, operateurs only (Direction is read-only), and you cannot
// remove your own access.
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sessionEmail = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!sessionEmail) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase non configuré." }, { status: 500 });

  const { id } = await ctx.params;

  // Authorization: block only an explicit "direction" (read-only) caller. Operateurs
  // and users with no profile row (legacy accounts created directly in Auth) are
  // allowed — the session cookie is the primary gate, this is defense-in-depth.
  const meRes = await supabaseFetch(`rest/v1/profiles?email=eq.${encodeURIComponent(sessionEmail)}&select=role`);
  const meRows = meRes.ok ? await meRes.json().catch(() => []) : [];
  const myRole = Array.isArray(meRows) ? meRows[0]?.role : null;
  if (myRole === "direction") {
    return NextResponse.json({ error: "Accès réservé aux opérateurs." }, { status: 403 });
  }

  // Safety: don't let someone remove their own access. Resolve the target's email
  // from Auth (the source of truth) rather than the possibly-empty profiles table.
  const targetRes = await supabaseFetch(`auth/v1/admin/users/${encodeURIComponent(id)}`);
  if (targetRes.ok) {
    const target = await targetRes.json().catch(() => ({}));
    if (target?.email && String(target.email).toLowerCase() === sessionEmail.toLowerCase()) {
      return NextResponse.json({ error: "Vous ne pouvez pas retirer votre propre accès." }, { status: 400 });
    }
  }

  // 1) Revoke login — delete the auth user. 404 = already gone.
  const del = await supabaseFetch(`auth/v1/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!del.ok && del.status !== 404) {
    const detail = await del.text().catch(() => "");
    return NextResponse.json({ error: detail || "Échec de la suppression de l'utilisateur." }, { status: del.status });
  }

  // 2) Drop the profile row (role record), if any. Non-fatal — access is already revoked.
  await supabaseFetch(`rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });

  return NextResponse.json({ id, deleted: true });
}
