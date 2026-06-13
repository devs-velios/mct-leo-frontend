// Server-only access to the Léo backend (the Fastify API with all business logic).
// Browser calls /api/leo/<path>; the proxy route forwards here, attaching the user's JWT
// (when present) so nothing but a same-origin call is exposed to the client.

import { LEO_API_URL as CONFIG_LEO_API_URL } from "@/lib/config";
import { resilientFetch } from "@/lib/server/http";

export const LEO_API_URL = CONFIG_LEO_API_URL;

/** Cookie holding the Supabase access token (set at login). */
export const TOKEN_COOKIE = "mct_token";

/**
 * Forward a request to the Léo backend. `path` is everything after the host, e.g.
 * "api/dashboard" or "api/centres/<id>". Attaches `Authorization: Bearer <token>` when a
 * token is provided (required only when the backend has RBAC_ENABLED=true).
 */
export async function leoFetch(path: string, init: RequestInit = {}, token?: string): Promise<Response> {
  const cleanPath = path.replace(/^\/+/, "");
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return resilientFetch(`${LEO_API_URL}/${cleanPath}`, { ...init, headers });
}
