import { NextRequest, NextResponse } from "next/server";
import { supabaseFetch, hasSupabaseEnv } from "@/lib/server/supabase";
import { signSession } from "@/lib/server/session";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/config";

export const SESSION_COOKIE = "mct_session";
/** Supabase access token (JWT) — forwarded as Bearer by the /api/leo proxy when RBAC is on. */
export const TOKEN_COOKIE = "mct_token";

interface SessionUser {
  email: string;
}

interface SupabaseLoginResult {
  user: SessionUser | null;
  token?: string;
  error?: string;
}

// Attempt a real Supabase Auth (GoTrue) password login, proxied server-side.
async function trySupabaseLogin(email: string, password: string): Promise<SupabaseLoginResult> {
  if (!hasSupabaseEnv()) return { user: null };
  try {
    const res = await supabaseFetch("auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.error_description || data?.message || data?.error || "Identifiants incorrects.";
      return { user: null, error: errorMsg };
    }

    const resolvedEmail: string | undefined = data?.user?.email ?? email;
    return { user: resolvedEmail ? { email: resolvedEmail } : null, token: data?.access_token };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : "Erreur de connexion avec le service d'authentification."
    };
  }
}

// Demo login, validated against server-only env vars. No hardcoded fallback.
function tryDemoLogin(email: string, password: string): SessionUser | null {
  const demoEmail = DEMO_EMAIL;
  const demoPassword = DEMO_PASSWORD;
  if (demoEmail && demoPassword && email === demoEmail && password === demoPassword) {
    return { email };
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({ email: "", password: "" }));

  if (!email || !password) {
    return NextResponse.json({ error: "Veuillez remplir tous les champs." }, { status: 400 });
  }

  const hasSupabase = hasSupabaseEnv();
  let user: SessionUser | null = null;
  let token: string | undefined;
  let errorMsg: string | undefined;

  if (hasSupabase) {
    const authResult = await trySupabaseLogin(email, password);
    user = authResult.user;
    token = authResult.token;
    errorMsg = authResult.error;
  } else {
    // If Supabase is not configured, check if we have environment-based demo credentials
    user = tryDemoLogin(email, password);
    if (!user) {
      errorMsg = "Le service d'authentification n'est pas configuré et aucune variable de démonstration n'est définie.";
    }
  }

  if (!user) {
    return NextResponse.json(
      { error: errorMsg || "Email ou mot de passe incorrect." },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ user });

  // Set httpOnly, HMAC-signed session cookie (the email cannot be forged).
  res.cookies.set(SESSION_COOKIE, await signSession(user.email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8 // 8 hours
  });

  // Store the Supabase JWT so the /api/leo proxy can forward it as Bearer (needed once the
  // backend has RBAC_ENABLED=true; harmless while it's off).
  if (token) {
    res.cookies.set(TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8
    });
  }

  return res;
}
