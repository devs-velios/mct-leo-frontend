// Centres feature — shared types.

export interface CentreListItem {
  id: string;
  code_centre: string;
  enseigne: string | null;
  ville: string | null;
  type_contrat: string;
  activites: string[];
  statut_ouverture: string;
  created_at: string;
  etape_pipeline: string | null;
  // Most-recent dossier id — used to navigate to the dossier detail route.
  dossier_id?: string | null;
  contacts_clients?: Record<string, unknown>;
  // Geocoded on the backend (BAN) — present once a centre has been geocoded.
  latitude?: number | null;
  longitude?: number | null;
  // Most recent message timestamp (for "days inactive"), falls back to created_at.
  last_activity_at?: string | null;
}

export interface CentreFull {
  id: string;
  code_centre: string;
  enseigne: string | null;
  ville: string | null;
  type_contrat: string;
  activites: string[];
  statut_ouverture: string;
  street: string | null;
  street2: string | null;
  zip: string | null;
  region: string | null;
  country: string | null;
  contacts_clients: Record<string, unknown>;
  created_at: string;
  whatsapp_phone_number_id: string | null;
}

export interface CentreDossier {
  id: string;
  type_dossier: string;
  etape_pipeline: string;
  created_at: string;
  statut_ouverture: string;
  next_stage: string | null;
  prev_stage: string | null;
}

export interface CentrePiece {
  id: string;
  type_piece: string;
  nom_fichier_origine: string;
  nom_fichier_canonique: string;
  drive_path: string;
  drive_file_id: string | null;
  drive_link: string | null;
  confiance_classification: number;
  valide_par_humain: boolean;
  validated_at: string | null;
  rejet_raison: string | null;
  created_at: string;
}

export interface CentreMessage {
  id: string;
  sender: string;
  contenu: string;
  received_at: string;
}

export interface CentreAlert {
  id: string;
  centre_id: string;
  dossier_id: string | null;
  type: string;
  status: string;
  message: string;
  payload: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface CentreReminder {
  id: string;
  dossier_id: string;
  piece_attendue: string | null;
  scheduled_at: string;
  sent_at: string | null;
  status: string;
  message: string | null;
  kind: string;
  escalation: number;
  created_at: string;
}

export interface AuditEntry {
  action: string;
  actor_type: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  payload_apres: Record<string, unknown> | null;
  created_at: string;
}

export interface PiecesStats {
  present: number;
  missing: number;
  verified: number;
}

export interface CentreDetail {
  centre: CentreFull;
  dossiers: CentreDossier[];
  pieces: CentrePiece[];
  presentPieces: string[];
  missingPieces: string[];
  pieces_stats: PiecesStats;
  messages: CentreMessage[];
  alerts: CentreAlert[];
  reminders: CentreReminder[];
  audit: AuditEntry[];
}

export interface CreateCentrePayload {
  code_centre: string;
  enseigne?: string;
  ville?: string;
  type_contrat?: "R" | "P";
  activites?: string[];
  street?: string;
  street2?: string;
  zip?: string;
  region?: string;
  country?: string;
  contacts_clients?: Record<string, string>;
}

export interface UpdateCentrePayload {
  code_centre?: string;
  enseigne?: string;
  ville?: string;
  type_contrat?: string;
  activites?: string[];
  street?: string;
  street2?: string;
  zip?: string;
  region?: string;
  country?: string;
  contacts_clients?: Record<string, unknown>;
  statut_ouverture?: string;
}

export type CentresStatus = "idle" | "loading" | "loaded" | "error";

export interface CentresState {
  list: CentreListItem[];
  count: number;
  detail: CentreDetail | null;
  listStatus: CentresStatus;
  detailStatus: CentresStatus;
  error: string | null;
}
