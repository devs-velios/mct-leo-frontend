// Server-only resilient fetch for outbound calls to the Léo backend + Supabase.
//
// Problem it fixes: a single transient connect/network blip used to become a hard,
// empty 500. We now bound every call with an explicit timeout and retry once or
// twice on transient network errors (most succeed on the next attempt).
//
// Connection pooling/keep-alive: Node's built-in fetch (undici) already keeps
// sockets alive with a conservative ~4s idle timeout by default, so repeat/sequential
// calls reuse warm connections without us configuring a custom dispatcher. (We must
// NOT pass an Agent from the standalone `undici` package as `dispatcher` here — it's a
// different instance from Node's internal undici and makes every fetch throw.)
//
// Node runtime only — imported solely by Route Handlers (never the edge middleware).

const TRANSIENT = /UND_ERR_CONNECT_TIMEOUT|UND_ERR_SOCKET|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|other side closed|terminated|fetch failed/i;

function isTransient(err: unknown): boolean {
  // A connect-timeout surfaces as UND_ERR_CONNECT_TIMEOUT (matched below) well before
  // our own AbortController fires; if the AbortController DID fire, the backend is
  // genuinely stuck — don't hammer it with retries.
  if (err instanceof DOMException && err.name === "AbortError") return false;
  const e = err as { code?: string; message?: string; cause?: { code?: string; message?: string } };
  const hay = `${e?.code ?? ""} ${e?.message ?? ""} ${e?.cause?.code ?? ""} ${e?.cause?.message ?? ""}`;
  return TRANSIENT.test(hay);
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface ResilientOptions {
  /** Hard ceiling for the whole attempt (connect + response). Default 20s. */
  timeoutMs?: number;
  /** Extra attempts after the first on transient failures. Default 2. */
  retries?: number;
}

/**
 * fetch() with a per-call timeout and a couple of retries on transient network
 * failures. Non-transient errors (and HTTP error statuses) pass straight through —
 * only connection-level failures are retried.
 */
export async function resilientFetch(url: string, init: RequestInit = {}, opts: ResilientOptions = {}): Promise<Response> {
  const { timeoutMs = 20_000, retries = 2 } = opts;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
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
