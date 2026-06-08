// Assistant feature — network layer.

import { api } from "@/lib/api";
import { type RagResponse, type AskParams, type InterpretParams } from "./types";

export async function askRag(params: AskParams): Promise<RagResponse> {
  return api.post<RagResponse>("rag/ask", params);
}

// Read-only intent + context inspection for a centre (runs the inbound pipeline steps).
export async function interpret(params: InterpretParams): Promise<unknown> {
  return api.post("ai/interpret", params);
}
