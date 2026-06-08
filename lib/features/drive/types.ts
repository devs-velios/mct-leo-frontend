// Drive feature — shared types. Mirrors GET /api/drive/folders and /api/drive/files.

export interface DriveEntry {
  id: string;
  name: string;
  type?: string;
  mimeType?: string;
}

export interface DriveContents {
  folders: DriveEntry[];
  files: DriveEntry[];
}

export type FetchStatus = "idle" | "loading" | "loaded" | "error";

export interface DriveState {
  // Browse results cached per directory path ("" = root).
  byPath: Record<string, DriveContents>;
  statusByPath: Record<string, FetchStatus>;
}
