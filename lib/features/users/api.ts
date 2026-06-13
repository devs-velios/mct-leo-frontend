// Users feature — network layer.
//
// invite → Léo backend (via the /api/leo proxy).
// list / remove → the frontend's own same-origin server routes (NOT the Léo proxy),
// which read `profiles` + the Supabase Admin API with the server-held service key.

import { api } from "@/lib/api";
import { type InviteUserPayload, type InviteResult, type AppUser } from "./types";

export async function inviteUser(payload: InviteUserPayload): Promise<InviteResult> {
  return api.post<InviteResult>("admin/users", payload);
}

export async function fetchUsers(): Promise<{ users: AppUser[]; count: number }> {
  const res = await fetch("/api/users", { credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Échec du chargement des utilisateurs (${res.status})`);
  return { users: data.users ?? [], count: data.count ?? 0 };
}

export async function deleteUser(id: string): Promise<{ id: string; deleted: boolean }> {
  const res = await fetch(`/api/users/${id}`, { method: "DELETE", credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Échec de la suppression (${res.status})`);
  return data;
}
