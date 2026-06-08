// Folders feature — network layer.

import { api } from "@/lib/api";
import { type Folder, type RoutingEntry, type CreateFolderPayload, type UpdateFolderPayload } from "./types";

export async function fetchFolders(): Promise<{ folders: Folder[]; routing: RoutingEntry[] }> {
  return api.get<{ folders: Folder[]; routing: RoutingEntry[] }>("folders");
}

export async function createFolder(payload: CreateFolderPayload): Promise<Folder> {
  return api.post<Folder>("folders", payload);
}

export async function updateFolder(id: string, payload: UpdateFolderPayload): Promise<Folder> {
  return api.patch<Folder>(`folders/${id}`, payload);
}

export async function setRouting(doc_key: string, folder_name: string): Promise<RoutingEntry> {
  return api.put<RoutingEntry>("folders/routing", { doc_key, folder_name });
}
