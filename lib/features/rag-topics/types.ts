// RAG topics feature — shared types. Mirrors /api/rag/topics.
// Each topic is a subject the intent classifier can match an inbound message to;
// when `requires_approval` is on, matching messages are PARKED for supervisor
// approval (Approbations) instead of auto-replied. The catch-all "autre" topic
// should normally stay OFF — flagging it parks every uncategorized message.

export interface RagTopic {
  section: string; // stable key, e.g. "autre", "reglementation"
  label: string; // human label
  requires_approval: boolean; // "validation superviseur avant envoi"
  updated_at?: string;
}

export interface RagTopicsListResponse {
  topics: RagTopic[];
}

export interface CreateRagTopicPayload {
  section: string;
  label: string;
  requires_approval?: boolean;
}

export interface UpdateRagTopicPayload {
  label?: string;
  requires_approval?: boolean;
}

export interface RagTopicsState {
  list: RagTopic[];
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
}
