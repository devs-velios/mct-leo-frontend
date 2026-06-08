// Pieces feature — network layer.

import { api } from "@/lib/api";
import { type Piece, type PiecesStats, type PiecesListParams, type QueuePiece } from "./types";

// Global validation queue (all centres), already joined with centre info + statut.
export async function fetchPiecesQueue(status?: string): Promise<{ pieces: QueuePiece[]; count: number }> {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return api.get<{ pieces: QueuePiece[]; count: number }>(`pieces/queue${q}`);
}

// Operator rejects a document (persists rejet_raison + status).
export async function rejectPiece(id: string, reason: string): Promise<Piece> {
  return api.post<Piece>(`pieces/${id}/reject`, { reason });
}

export async function fetchPieces(params: PiecesListParams = {}): Promise<{ pieces: Piece[]; count: number }> {
  const qs = new URLSearchParams();
  if (params.dossier_id) qs.set("dossier_id", params.dossier_id);
  if (params.verified !== undefined) qs.set("verified", String(params.verified));
  const query = qs.toString();
  return api.get<{ pieces: Piece[]; count: number }>(`pieces${query ? `?${query}` : ""}`);
}

export async function fetchPiecesStats(dossierId?: string): Promise<PiecesStats> {
  const q = dossierId ? `?dossier_id=${dossierId}` : "";
  return api.get<PiecesStats>(`pieces/stats${q}`);
}

export async function fetchPiece(id: string): Promise<Piece> {
  return api.get<Piece>(`pieces/${id}`);
}

export async function verifyPiece(id: string): Promise<Piece> {
  return api.post<Piece>(`pieces/${id}/verify`);
}

export async function movePiece(id: string, folderPath: string): Promise<Piece> {
  return api.post<Piece>(`pieces/${id}/move`, { folderPath });
}

export async function renamePiece(id: string, newName: string): Promise<Piece> {
  return api.post<Piece>(`pieces/${id}/rename`, { newName });
}

// NOTE: the backend exposes no "reject" endpoint (only verify/move/rename). Rejection
// is therefore a client-side-only action today — surfaced here so callers are explicit.
