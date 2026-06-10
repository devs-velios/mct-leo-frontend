// Conversations feature — view-model mapping + domain selectors. The backend→view
// transforms (inbox → conversation, message → view message) and the inbox filter
// live here so the Conversations view stays presentational.

import { type InboxItem, type ConvMessage } from "./types";

export interface Message {
  sender: string;
  text: string;
  type: "ai" | "user"; // ai: left-aligned (Léo/Assistant), user: right-aligned (operator/client)
  time: string;
}

export interface Conversation {
  id: string;
  code?: string; // human-friendly code_centre (never show the raw UUID id)
  title: string;
  subtitle: string;
  phase: "Signature" | "Onboarding" | "Dépôt" | "Ouvert" | "Suivi";
  lastActivity: string;
  siret: string;
  denomination: string;
  adresse: string;
  signatureDate: string;
  ouvertureDate: string;
  gerant: string;
  phone: string;
  email: string;
  messages: Message[];
}

const STATUT_PHASE_CONV: Record<string, Conversation["phase"]> = {
  onboarding: "Onboarding",
  audit: "Dépôt",
  agrement_en_cours: "Dépôt",
  ouvert: "Ouvert",
  bloque: "Onboarding",
};

/** Map a backend inbox item → the conversation triage view-model (id = centre_id). */
export function inboxToConversation(i: InboxItem): Conversation {
  return {
    id: i.centre_id,
    code: i.code_centre,
    title: i.enseigne ?? i.code_centre,
    subtitle: `${i.code_centre}${i.ville ? ` - ${i.ville}` : ""}`,
    phase: STATUT_PHASE_CONV[i.statut_ouverture] ?? "Onboarding",
    lastActivity: i.last_message ? new Date(i.last_message.received_at).toLocaleString("fr-FR") : "—",
    siret: "",
    denomination: i.enseigne ?? "",
    adresse: "",
    signatureDate: "",
    ouvertureDate: "",
    gerant: "",
    phone: "",
    email: "",
    messages: [],
  };
}

/** Map a backend message → the chat view's message shape (sender role → alignment). */
export function apiMessageToMsg(m: ConvMessage): Message {
  return {
    sender: m.sender === "leo" ? "Léo" : m.sender === "interne" ? "Interne" : "Client",
    text: m.contenu,
    time: new Date(m.received_at).toLocaleString("fr-FR"),
    type: m.sender === "leo" ? "ai" : "user",
  };
}

// ── Inbound-reply polling (Léo answers via the async inbound worker) ───────────
const REPLY_POLL_INTERVAL_MS = 10_000;
const REPLY_POLL_MAX_ATTEMPTS = 30; // ~5 min safety cap so we never poll forever
const REPLY_EXPECTED_DELTA = 2; // client message + Léo's reply

/**
 * Wait for Léo's async inbound reply after a send. Polls `fetchDetail` every
 * interval, calling `onGrow(detail)` whenever the message count increases, and
 * resolves once the reply lands (count grew by `delta`) or the safety cap is hit.
 * Encapsulates the polling cadence/stop-rule so views don't reimplement the loop.
 */
export async function awaitInboundReply<T>(opts: {
  fetchDetail: () => Promise<T>;
  count: (detail: T) => number;
  baseCount: number;
  delta?: number;
  onGrow: (detail: T) => void;
}): Promise<void> {
  const { fetchDetail, count, baseCount, delta = REPLY_EXPECTED_DELTA, onGrow } = opts;
  for (let attempt = 1; attempt <= REPLY_POLL_MAX_ATTEMPTS; attempt++) {
    await new Promise((r) => setTimeout(r, REPLY_POLL_INTERVAL_MS));
    try {
      const detail = await fetchDetail();
      const n = count(detail);
      if (n > baseCount) onGrow(detail);
      if (n >= baseCount + delta) return; // Léo answered
    } catch {
      /* keep polling until the cap */
    }
  }
}

/** Apply the phase + free-text search filter to the inbox conversations. */
export function filterConversations(
  items: Conversation[],
  opts: { search?: string; phase?: string },
): Conversation[] {
  const { search = "", phase = "Toutes phases" } = opts;
  const query = search.trim().toLowerCase();
  return items.filter((c) => {
    if (phase !== "Toutes phases" && c.phase !== phase) return false;
    if (query) {
      const hit =
        c.title.toLowerCase().includes(query) ||
        c.subtitle.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query);
      if (!hit) return false;
    }
    return true;
  });
}
