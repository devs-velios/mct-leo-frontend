// Assistant feature — shared types. Mirrors POST /api/rag/ask and POST /api/ai/interpret.

export interface ChatMsg {
  role: "user" | "leo";
  text: string;
  sources?: string[];
  needsApproval?: boolean;
}

export interface RagResponse {
  answer: string;
  sources: string[];
  needsApproval: boolean;
}

export interface AskParams {
  question: string;
  corpus?: "mct" | "all";
  lang?: "fr" | "en";
}

export interface InterpretParams {
  centre_id: string;
  text: string;
}

export type FetchStatus = "idle" | "loading" | "error";

export interface AssistantState {
  messages: ChatMsg[];
  status: FetchStatus;
  error: string | null;
}
