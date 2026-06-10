// Pipeline catalog feature — network layer. Every write returns the full updated
// catalog, so callers just replace their local state with the response.

import { api } from "@/lib/api";
import { type PipelineCatalog, type AddPhasePayload, type EditPhasePayload } from "./types";

export async function fetchPipeline(): Promise<PipelineCatalog> {
  return api.get<PipelineCatalog>("dossiers/pipeline");
}

export async function addPhase(payload: AddPhasePayload): Promise<PipelineCatalog> {
  return api.post<PipelineCatalog>("dossiers/pipeline", payload);
}

export async function editPhase(phase: string, payload: EditPhasePayload): Promise<PipelineCatalog> {
  return api.patch<PipelineCatalog>(`dossiers/pipeline/${encodeURIComponent(phase)}`, payload);
}

export async function deletePhase(phase: string): Promise<PipelineCatalog> {
  return api.del<PipelineCatalog>(`dossiers/pipeline/${encodeURIComponent(phase)}`);
}
