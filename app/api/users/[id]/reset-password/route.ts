import { NextRequest, NextResponse } from "next/server";
import { supabaseFetch, hasSupabaseEnv } from "@/lib/server/supabase";
import { verifySession } from "@/lib/server/session";
import { SESSION_COOKIE } from "../../../auth/login/route";

// Send a password-reset email to an app user. The Léo backend exposes no such
// endpoint, so we trigger it here with the server-held service key (same pattern as
// the DELETE route): resolve the target's email from Supabase Auth, then call the
// Supabase `recover` endpoint which emails them a reset link (requires SMTP, like
// the invite flow). Guards: session-gated, operateurs only (Direction is read-only).
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sessionEmail = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!sessionEmail) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase non configuré." }, { status: 500 });

  const { id } = await ctx.params;

  // Authorization: block an explicit "direction" (read-only) caller. Operateurs and
  // legacy accounts with no profile row are allowed — the session cookie is the gate.
  const meRes = await supabaseFetch(`rest/v1/profiles?email=eq.${encodeURIComponent(sessionEmail)}&select=role`);
  const meRows = meRes.ok ? await meRes.json().catch(() => []) : [];
  const myRole = Array.isArray(meRows) ? meRows[0]?.role : null;
  if (myRole === "direction") {
    return NextResponse.json({ error: "Accès réservé aux opérateurs." }, { status: 403 });
  }

  // Resolve the target's email from Auth (source of truth).
  const targetRes = await supabaseFetch(`auth/v1/admin/users/${encodeURIComponent(id)}`);
  if (!targetRes.ok) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }
  const target = await targetRes.json().catch(() => ({}));
  const email = target?.email as string | undefined;
  if (!email) return NextResponse.json({ error: "Cet utilisateur n'a pas d'email." }, { status: 400 });

  // Trigger the password-recovery email (Supabase emails a reset link via SMTP).
  const recover = await supabaseFetch("auth/v1/recover", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!recover.ok) {
    const detail = await recover.text().catch(() => "");
    return NextResponse.json(
      { error: detail || "Échec de l'envoi de l'email de réinitialisation (SMTP non configuré ?)." },
      { status: recover.status },
    );
  }

  return NextResponse.json({ sent: true, email });
}
