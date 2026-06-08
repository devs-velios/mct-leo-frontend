// Simulate feature — network layer.

import { api } from "@/lib/api";
import { type OdooSimulationPayload, type SimulateOdooResult } from "./types";

// Mimic an Odoo "deal won" → real onboarding (centre + WhatsApp group + reminder).
export async function simulateOdoo(payload: OdooSimulationPayload): Promise<SimulateOdooResult> {
  return api.post<SimulateOdooResult>("simulate/odoo", payload);
}

// Mimic a client WhatsApp text → Léo's inbound pipeline.
export async function simulateWhatsappMessage(centreId: string, text: string): Promise<unknown> {
  return api.post("simulate/whatsapp/message", { centre_id: centreId, text });
}

// Mimic a client sending a file → OCR → classify → Drive (multipart, raw fetch).
export async function simulateWhatsappDocument(centreId: string, file: File): Promise<unknown> {
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
