// Dossiers feature — network layer.

import { api } from "@/lib/api";
import { type DossierListItem, type DossierDetail, type AdvancePayload } from "./types";

interface ListParams {
  stage?: string;
  centre_id?: string;
  limit?: number;
  offset?: number;
}

export async function fetchDossiers(params: ListParams = {}): Promise<{ dossiers: DossierListItem[]; count: number }> {
  const qs = new URLSearchParams();
  if (params.stage) qs.set("stage", params.stage);
  if (params.centre_id) qs.set("centre_id", params.centre_id);
  qs.set("limit", String(params.limit ?? 200));
  if (params.offset) qs.set("offset", String(params.offset));
  return api.get<{ dossiers: DossierListItem[]; count: number }>(`dossiers?${qs.toString()}`);
}

export async function fetchDossier(id: string): Promise<DossierDetail> {
  return api.get<DossierDetail>(`dossiers/${id}`);
}

export async function advanceDossierStage(id: string, payload: AdvancePayload = {}): Promise<DossierDetail> {
  return api.post<DossierDetail>(`dossiers/${id}/advance-stage`, payload);
}
