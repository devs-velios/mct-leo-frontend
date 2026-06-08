// Conversations feature — network layer.

import { api } from "@/lib/api";
import { type InboxItem, type ConvMessage } from "./types";

interface InboxParams {
  q?: string;
  limit?: number;
  offset?: number;
}

export async function fetchInbox(params: InboxParams = {}): Promise<{ conversations: InboxItem[]; count: number }> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return api.get<{ conversations: InboxItem[]; count: number }>(`conversations${query ? `?${query}` : ""}`);
}

export async function fetchMessages(centreId: string, limit = 200): Promise<{ messages: ConvMessage[]; count: number }> {
  return api.get<{ messages: ConvMessage[]; count: number }>(`centres/${centreId}/messages?limit=${limit}`);
}

// Send a client WhatsApp message through the simulator → Léo's inbound pipeline.
export async function sendClientMessage(centreId: string, text: string): Promise<unknown> {
  return api.post("simulate/whatsapp/message", { centre_id: centreId, text });
}

// Upload a document as the client → OCR → classify → Drive (multipart, so raw fetch).
export async function uploadClientDocument(centreId: string, file: File): Promise<unknown> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/leo/simulate/whatsapp/document?centre_id=${centreId}`, {
    method: "POST",
    body: fd,
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return res.json().catch(() => ({}));
}
