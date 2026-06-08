// Alerts feature — network layer.

import { api } from "@/lib/api";
import { type Alert, type AlertStatusFilter } from "./types";

interface ListParams {
  status?: AlertStatusFilter;
  centre_id?: string;
}

export async function fetchAlerts(params: ListParams = {}): Promise<{ alerts: Alert[]; count: number }> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.centre_id) qs.set("centre_id", params.centre_id);
  const query = qs.toString();
  return api.get<{ alerts: Alert[]; count: number }>(`alerts${query ? `?${query}` : ""}`);
}

export async function resolveAlert(id: string): Promise<{ id: string; status: string }> {
  return api.post<{ id: string; status: string }>(`alerts/${id}/resolve`);
}
