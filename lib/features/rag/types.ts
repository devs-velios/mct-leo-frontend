// RAG feature — shared types. Mirrors GET /api/rag/suggestions (the « RAG en
// attente de validation » review queue: Léo answers awaiting operator approval).

export type RagSuggestionStatus = "pending" | "approved" | "rejected";

export interface RagSuggestion {
  id: string;
  centre_id: string;
  dossier_id: string | null;
  /** The client's question that triggered the (sensitive) RAG answer. */
  question: string;
  /** Léo's proposed answer, parked for review (NOT yet sent to the client). */
  draft_answer: string;
  sources: string[];
  /** Why this answer was flagged for approval (e.g. the topic requires supervisor validation). */
  sensitive_reason: string | null;
  status: RagSuggestionStatus;
  /** The answer actually sent, once approved (may be an edited draft). */
  final_answer: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export type RagSuggestionFilter = RagSuggestionStatus;

export type FetchStatus = "idle" | "loading" | "loaded" | "error";

export interface RagState {
  suggestions: RagSuggestion[];
  count: number;
  status: FetchStatus;
  error: string | null;
  /** Which filter the current `suggestions` belong to — so a tab switch can drop
   *  the previous tab's rows instead of flashing them under the new tab. */
  loadedFilter: RagSuggestionFilter | null;
}
