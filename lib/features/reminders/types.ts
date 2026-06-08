// Reminders feature — shared types. Mirrors GET/POST/PATCH /api/reminders.

export interface Reminder {
  id: string;
  dossier_id: string;
  piece_attendue: string | null;
  scheduled_at: string;
  sent_at?: string | null;
  status: string; // pending | sent | cancelled
  message: string | null;
  kind: string; // auto | manual
  escalation: number;
  created_at?: string;
}

export interface CreateReminderPayload {
  dossier_id: string;
  piece?: string | null;
  message?: string | null;
  scheduled_at: string; // ISO datetime
}

export interface UpdateReminderPayload {
  scheduled_at?: string;
  message?: string | null;
}

export type FetchStatus = "idle" | "loading" | "loaded" | "error";

export interface RemindersState {
  list: Reminder[];
  count: number;
  status: FetchStatus;
  error: string | null;
}
