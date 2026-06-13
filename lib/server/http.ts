// Server-only resilient fetch for outbound calls to the Léo backend + Supabase.
//
// Two production problems this fixes:
//  1. Every call opened a fresh TCP+TLS connection → under the burst of parallel
//     requests each page load fires, the backend intermittently failed to accept
//     them in time (UND_ERR_CONNECT_TIMEOUT). A keep-alive connection pool reuses
//     warm sockets, so repeat/sequential calls skip the handshake entirely.
//  2. A single transient connect/network blip became a hard 500. We now retry once
//     on transient errors and bound every call with an explicit timeout.
//
// Node runtime only — imported solely by Route Handlers (never the edge middleware).

import { Agent } from "undici";

// One shared keep-alive pool for the whole server process (reused across warm
// serverless invocations). `connect.timeout` fails a stuck handshake fast so the
// retry can fire well within the function's execution budget.
const dispatcher = new Agent({
  keepAliveTimeout: 30_000,
  keepAliveMaxTimeout: 60_000,
  connections: 64, // per-origin socket cap
  connect: { timeout: 6_000 },
});

const TRANSIENT = /UND_ERR_CONNECT_TIMEOUT|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|fetch failed|other side closed/i;

function isTransient(err: unknown): boolean {
  const e = err as { code?: string; message?: string; cause?: { code?: string; message?: string } };
  const hay = `${e?.code ?? ""} ${e?.message ?? ""} ${e?.cause?.code ?? ""} ${e?.cause?.message ?? ""}`;
  return TRANSIENT.test(hay);
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface ResilientOptions {
  /** Hard ceiling for the whole attempt (connect + response). Default 20s. */
  timeoutMs?: number;
  /** Extra attempts after the first on transient failures. Default 1. */
  retries?: number;
}

/**
 * fetch() with a keep-alive dispatcher, per-call timeout, and one retry on transient
 * network failures. Non-transient errors (and HTTP error statuses) pass straight
 * through — only connection-level failures are retried.
 */
export async function resilientFetch(url: string, init: RequestInit = {}, opts: ResilientOptions = {}): Promise<Response> {
  const { timeoutMs = 20_000, retries = 1 } = opts;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // `dispatcher` is an undici extension to fetch options (not in the DOM types).
      return await fetch(url, { ...init, signal: controller.signal, dispatcher } as RequestInit & { dispatcher: Agent });
    } catch (err) {
      lastErr = err;
      if (attempt >= retries || !isTransient(err)) throw err;
      await delay(200 * (attempt + 1)); // brief backoff, lets a burst drain
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}
