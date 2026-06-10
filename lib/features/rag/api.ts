// RAG feature — network layer. Talks to the backend rag module via the /api/leo proxy.

import { api } from "@/lib/api";
import { type RagSuggestion, type RagSuggestionFilter } from "./types";

interface ListParams {
  status?: RagSuggestionFilter;
  centre_id?: string;
}

export async function fetchSuggestions(params: ListParams = {}): Promise<{ suggestions: RagSuggestion[]; count: number }> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.centre_id) qs.set("centre_id", params.centre_id);
  const query = qs.toString();
  return api.get<{ suggestions: RagSuggestion[]; count: number }>(`rag/suggestions${query ? `?${query}` : ""}`);
}

/** Approve a pending suggestion → sends the (optionally edited) answer to the client via WhatsApp. */
export async function approveSuggestion(id: string, answer?: string | null): Promise<RagSuggestion> {
  return api.post<RagSuggestion>(`rag/suggestions/${id}/approve`, { answer: answer ?? null });
}

/** Reject a pending suggestion — nothing is sent to the client. */
export async function rejectSuggestion(id: string): Promise<RagSuggestion> {
  return api.post<RagSuggestion>(`rag/suggestions/${id}/reject`);
}
