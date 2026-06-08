// Server-only Supabase access. This module reads the secret env vars and must
// never be imported from a Client Component — only from Route Handlers under
// app/api/*. Keeping the URL + key here is what lets us proxy every request so
// nothing Supabase-related leaks into the browser console / network tab.

import { SUPABASE_URL as CONFIG_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/config";

export const SUPABASE_URL = CONFIG_SUPABASE_URL;
export const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY;

export function hasSupabaseEnv(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

/**
 * Forward a request to Supabase with the server-held credentials injected.
 * `path` is everything after the host, e.g. "auth/v1/token?grant_type=password"
 * or "rest/v1/centres?select=*".
 */
export async function supabaseFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const cleanPath = path.replace(/^\/+/, "");
  const headers = new Headers(init.headers);
  headers.set("apikey", SUPABASE_KEY);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${SUPABASE_KEY}`);
  }
  return fetch(`${SUPABASE_URL}/${cleanPath}`, { ...init, headers });
}
