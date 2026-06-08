// Drive feature — network layer (read-only browse).

import { api } from "@/lib/api";
import { type DriveEntry } from "./types";

export async function fetchDriveFolders(path: string): Promise<{ path: string; folders: DriveEntry[] }> {
  return api.get<{ path: string; folders: DriveEntry[] }>(`drive/folders?path=${encodeURIComponent(path)}`);
}

export async function fetchDriveFiles(path: string): Promise<{ path: string; files: DriveEntry[] }> {
  return api.get<{ path: string; files: DriveEntry[] }>(`drive/files?path=${encodeURIComponent(path)}`);
}
