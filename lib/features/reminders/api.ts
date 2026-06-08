// Reminders feature — network layer.

import { api } from "@/lib/api";
import { type Reminder, type CreateReminderPayload, type UpdateReminderPayload } from "./types";

interface ListParams {
  dossier_id?: string;
  status?: string;
}

export async function fetchReminders(params: ListParams = {}): Promise<{ reminders: Reminder[]; count: number }> {
  const qs = new URLSearchParams();
  if (params.dossier_id) qs.set("dossier_id", params.dossier_id);
  if (params.status) qs.set("status", params.status);
  const query = qs.toString();
  return api.get<{ reminders: Reminder[]; count: number }>(`reminders${query ? `?${query}` : ""}`);
}

export async function createReminder(payload: CreateReminderPayload): Promise<Reminder> {
  return api.post<Reminder>("reminders", payload);
}

export async function updateReminder(id: string, payload: UpdateReminderPayload): Promise<Reminder> {
  return api.patch<Reminder>(`reminders/${id}`, payload);
}

export async function stopReminder(id: string): Promise<{ id: string; status: string }> {
  return api.post<{ id: string; status: string }>(`reminders/${id}/stop`);
}

export async function deleteReminder(id: string): Promise<{ id: string; deleted: boolean }> {
  return api.del<{ id: string; deleted: boolean }>(`reminders/${id}`);
}
