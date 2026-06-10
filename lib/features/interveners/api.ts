// Interveners feature — network layer.

import { api } from "@/lib/api";
import {
  type Intervener,
  type IntervenersListResponse,
  type CreateIntervenerPayload,
  type UpdateIntervenerPayload,
} from "./types";

export async function fetchInterveners(category?: string): Promise<IntervenersListResponse> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return api.get<IntervenersListResponse>(`interveners${qs}`);
}

export async function createIntervener(payload: CreateIntervenerPayload): Promise<Intervener> {
  return api.post<Intervener>("interveners", payload);
}

export async function updateIntervener(id: string, payload: UpdateIntervenerPayload): Promise<Intervener> {
  return api.patch<Intervener>(`interveners/${id}`, payload);
}

export async function deleteIntervener(id: string): Promise<{ deleted: boolean; id: string }> {
  return api.del<{ deleted: boolean; id: string }>(`interveners/${id}`);
}
