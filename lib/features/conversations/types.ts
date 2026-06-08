// Conversations feature — shared types. Mirrors GET /api/conversations and
// GET /api/centres/:id/messages.

export interface InboxItem {
  centre_id: string;
  code_centre: string;
  enseigne: string | null;
  ville: string | null;
  statut_ouverture: string;
  message_count: number;
  last_message: { sender: string; contenu: string; received_at: string } | null;
}

export interface ConvMessage {
  id: string;
  sender: string;
  contenu: string;
  received_at: string;
}

export type FetchStatus = "idle" | "loading" | "loaded" | "error";

export interface ConversationsState {
  inbox: InboxItem[];
  count: number;
  status: FetchStatus;
  error: string | null;
  // Per-centre message cache + load status.
  messages: Record<string, ConvMessage[]>;
  messageStatus: Record<string, FetchStatus>;
  // Per-centre transient UI: waiting for Léo's reply / a document upload in flight.
  typing: Record<string, boolean>;
  uploading: Record<string, string | null>;
}
