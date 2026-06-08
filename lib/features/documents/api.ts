// Documents feature — network layer.

import { api } from "@/lib/api";
import { type AnalyzePayload, type AnalyzeResult } from "./types";

export async function analyzeDocument(payload: AnalyzePayload): Promise<AnalyzeResult> {
  return api.post<AnalyzeResult>("documents/analyze", payload);
}

// Helper: read a File into the base64 string the analyze endpoint expects.
export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
