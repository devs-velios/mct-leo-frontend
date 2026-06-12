// Required documents feature — network layer (via the /api/leo proxy).

import { api } from "@/lib/api";
import {
  type RequiredDocument,
  type RequiredDocumentsListResponse,
  type CreateRequiredDocumentPayload,
  type UpdateRequiredDocumentPayload,
} from "./types";

export async function fetchRequiredDocuments(): Promise<RequiredDocumentsListResponse> {
  return api.get<RequiredDocumentsListResponse>("required-documents");
}

export async function createRequiredDocument(payload: CreateRequiredDocumentPayload): Promise<RequiredDocument> {
  return api.post<RequiredDocument>("required-documents", payload);
}

export async function updateRequiredDocument(id: string, payload: UpdateRequiredDocumentPayload): Promise<RequiredDocument> {
  return api.patch<RequiredDocument>(`required-documents/${id}`, payload);
}

export async function deleteRequiredDocument(id: string): Promise<{ id: string; deleted: boolean }> {
  return api.del<{ id: string; deleted: boolean }>(`required-documents/${id}`);
}
