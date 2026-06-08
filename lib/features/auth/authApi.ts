// Auth feature — network layer. Talks only to same-origin /api/auth/* routes,
// which proxy to Supabase server-side. No Supabase URL or key is ever referenced
// here, so nothing sensitive ends up in the client bundle or the console.

import { type LoginCredentials, type LoginResponse } from "./types";

export async function loginRequest(credentials: LoginCredentials): Promise<LoginResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "Connexion impossible. Veuillez réessayer.");
  }

  return data as LoginResponse;
}

export async function logoutRequest(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
}
