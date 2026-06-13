// RAG topics feature — network layer (via the /api/leo proxy).

import { api } from "@/lib/api";
import {
  type RagTopic,
  type RagTopicsListResponse,
  type CreateRagTopicPayload,
  type UpdateRagTopicPayload,
} from "./types";

export async function fetchRagTopics(): Promise<RagTopicsListResponse> {
  return api.get<RagTopicsListResponse>("rag/topics");
}

export async function createRagTopic(payload: CreateRagTopicPayload): Promise<RagTopic> {
  return api.post<RagTopic>("rag/topics", payload);
}

export async function updateRagTopic(section: string, payload: UpdateRagTopicPayload): Promise<RagTopic> {
  return api.patch<RagTopic>(`rag/topics/${encodeURIComponent(section)}`, payload);
}

export async function deleteRagTopic(section: string): Promise<{ section: string; deleted: boolean }> {
  return api.del<{ section: string; deleted: boolean }>(`rag/topics/${encodeURIComponent(section)}`);
}
