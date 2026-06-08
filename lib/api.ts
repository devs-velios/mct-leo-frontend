// Client-side API helper. Talks only to the same-origin /api/leo/* proxy, which forwards to
// the Léo backend (attaching the JWT server-side). Use these from Client Components.

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method, credentials: "same-origin", headers: {} };
  if (body !== undefined) {
    (init.headers as Record<string, string>)["content-type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`/api/leo/${path.replace(/^\/+/, "")}`, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path)
};

// ── Shared response types (mirror the backend; extend as pages are wired) ─────────────────

export interface DashboardStats {
  centres: { total: number; by_statut: Record<string, number> };
  dossiers: { total: number; by_stage: Record<string, number> };
  open_alerts: number;
  pending_reminders: number;
  pieces: { total: number; verified: number };
}
