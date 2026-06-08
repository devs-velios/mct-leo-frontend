// Users feature — shared types. Mirrors POST /api/admin/users.
//
// NOTE: the backend exposes NO "list users" endpoint — only invite. So this feature
// is invite-only; `invited` below is just the in-session log of invitations sent.

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

export interface UsersState {
  invited: InviteResult[];
}
