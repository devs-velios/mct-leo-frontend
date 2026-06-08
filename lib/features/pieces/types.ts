// Pieces feature — shared types. Mirrors GET /api/pieces, /api/pieces/stats.

export interface Piece {
  id: string;
  dossier_id: string;
  type_piece: string;
  nom_fichier_origine: string | null;
  nom_fichier_canonique: string | null;
  drive_path: string | null;
  drive_file_id: string | null;
  drive_link: string | null;
  confiance_classification: number | null;
  valide_par_humain: boolean;
  rejet_raison: string | null;
  validated_at: string | null;
  created_at: string;
}

export interface PiecesStats {
  total: number;
  verified: number;
  unverified: number;
}

// One row of the global validation queue (GET /api/pieces/queue) — already joined
// with centre info + a derived workflow status, so the Validations page needs no
// extra joins.
export interface QueuePiece {
  id: string;
  type_piece: string;
  nom_fichier: string | null;
  confiance: number | null;
  drive_link: string | null;
  created_at: string;
  statut: "a_identifier" | "a_valider" | "valide" | "rejete";
  // Source-of-truth flags — preferred over `statut` for approved/rejected display.
  valide_par_humain?: boolean;
  rejet_raison?: string | null;
  centre_id: string | null;
  code_centre: string | null;
  enseigne: string | null;
  ville: string | null;
}

export interface PiecesListParams {
  dossier_id?: string;
  verified?: boolean;
}

export type FetchStatus = "idle" | "loading" | "loaded" | "error";

export interface PiecesState {
  list: Piece[];
  count: number;
  stats: PiecesStats | null;
  status: FetchStatus;
  error: string | null;
  // Validation queue (separate from the dossier-scoped `list`).
  queue: QueuePiece[];
  queueStatus: FetchStatus;
}
