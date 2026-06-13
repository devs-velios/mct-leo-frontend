// Users feature — shared types.
//
// Invite goes through the Léo backend (POST /api/admin/users). The backend exposes
// NO list/delete, so listing + removal go through the frontend's own server routes
// (GET /api/users, DELETE /api/users/:id), which read `profiles` and the Supabase
// Admin API with the server-held service key — the Léo backend stays untouched.

export type Role = "operateur" | "direction";

export interface InviteUserPayload {
  email: string;
  role: Role | string;
}

export interface InviteResult {
  id: string;
  email: string;
  role: string;
  invited: boolean;
}

/** A row from the `profiles` table (the app's user directory). */
export interface AppUser {
  id: string;
  email: string | null;
  role: string | null;
  created_at: string;
}

export interface UsersState {
  list: AppUser[];
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
  /** In-session log of invitations sent. */
  invited: InviteResult[];
}
