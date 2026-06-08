// Centres feature — network layer.

import { api } from "@/lib/api";
import {
  type CentreListItem,
  type CentreDetail,
  type CentreFull,
  type CentreMessage,
  type CreateCentrePayload,
  type UpdateCentrePayload,
} from "./types";

interface ListParams {
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export async function fetchCentres(params: ListParams = {}): Promise<{ centres: CentreListItem[]; count: number }> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.q) qs.set("q", params.q);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return api.get<{ centres: CentreListItem[]; count: number }>(`centres${query ? `?${query}` : ""}`);
}

export async function fetchCentreDetail(id: string): Promise<CentreDetail> {
  return api.get<CentreDetail>(`centres/${id}`);
}

export async function createCentre(payload: CreateCentrePayload): Promise<{ centre: CentreFull; dossier_id: string | null }> {
  return api.post<{ centre: CentreFull; dossier_id: string | null }>("centres", payload);
}

export async function updateCentre(id: string, payload: UpdateCentrePayload): Promise<CentreFull> {
  return api.patch<CentreFull>(`centres/${id}`, payload);
}

export async function deleteCentre(id: string): Promise<{ id: string; deleted: boolean }> {
  return api.del<{ id: string; deleted: boolean }>(`centres/${id}`);
}

export async function fetchCentreMessages(id: string, limit = 100): Promise<{ messages: CentreMessage[]; count: number }> {
  return api.get<{ messages: CentreMessage[]; count: number }>(`centres/${id}/messages?limit=${limit}`);
}

export async function uploadCentreDocument(
  centreId: string,
  file: File,
  type: string,
  opts?: { folder?: string; name?: string; verified?: boolean }
): Promise<unknown> {
  const qs = new URLSearchParams({ type });
  if (opts?.folder) qs.set("folder", opts.folder);
  if (opts?.name) qs.set("name", opts.name);
  if (opts?.verified) qs.set("verified", "true");

  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`/api/leo/centres/${centreId}/documents?${qs}`, {
    method: "POST",
    body: fd,
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return res.json();
}
