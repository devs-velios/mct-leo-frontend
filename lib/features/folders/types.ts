// Folders feature — shared types. Mirrors GET/POST/PATCH /api/folders and
// PUT /api/folders/routing.

export interface Folder {
  id: string;
  name: string;
  label: string | null;
  sort_order: number;
  is_review: boolean;
  created_at?: string;
}

export interface RoutingEntry {
  doc_key: string;
  folder_name: string;
}

export interface CreateFolderPayload {
  name: string;
  label?: string;
  sort_order?: number;
  is_review?: boolean;
}

export interface UpdateFolderPayload {
  label?: string;
  sort_order?: number;
}

export type FetchStatus = "idle" | "loading" | "loaded" | "error";

export interface FoldersState {
  folders: Folder[];
  routing: RoutingEntry[];
  status: FetchStatus;
  error: string | null;
}
