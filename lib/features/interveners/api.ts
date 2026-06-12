// Interveners feature — network layer.

import { api } from "@/lib/api";
import {
  type Intervener,
  type IntervenersListResponse,
  type IntervenerCategoriesResponse,
  type CreateIntervenerPayload,
  type UpdateIntervenerPayload,
} from "./types";

export async function fetchInterveners(category?: string): Promise<IntervenersListResponse> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return api.get<IntervenersListResponse>(`interveners${qs}`);
}

/** The fixed routing categories + their descriptions (for the form dropdown). */
export async function fetchIntervenerCategories(): Promise<IntervenerCategoriesResponse> {
  return api.get<IntervenerCategoriesResponse>("interveners/categories");
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
