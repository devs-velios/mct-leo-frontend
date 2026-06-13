// Signed session cookie (HMAC-SHA256) so the `mct_session` value cannot be forged.
// The value is `base64url(email).base64url(hmac)`; tampering with the email invalidates
// the signature. Uses Web Crypto so the SAME module works in Route Handlers (Node) and
// in the Edge middleware (proxy.ts).
//
// Secret: SESSION_SECRET if set, else the server-only Supabase service-role key as a
// strong fallback (never exposed to the browser). Set SESSION_SECRET in prod.

import { SESSION_SECRET } from "@/lib/config";

const enc = new TextEncoder();

function getSecret(): string {
  return SESSION_SECRET || "";
}

function toB64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(value: string): string {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// Import the HMAC key once and reuse it — importKey ran on every sign/verify before,
// which is pure overhead on a hot path (the edge middleware verifies on every request).
let keyPromise: Promise<CryptoKey> | null = null;
function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey(
      "raw",
      enc.encode(getSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }
  return keyPromise;
}

async function hmac(payload: string): Promise<string> {
  const mac = await crypto.subtle.sign("HMAC", await getKey(), enc.encode(payload));
  return toB64Url(mac);
}

/** Build a signed session value for the given email. */
export async function signSession(email: string): Promise<string> {
  const payload = toB64Url(enc.encode(email));
  return `${payload}.${await hmac(payload)}`;
}

/** Verify a signed session value; returns the email if valid, else null. */
export async function verifySession(value?: string | null): Promise<string | null> {
  if (!value || !getSecret()) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);

  const expected = await hmac(payload);
  // Length-checked, constant-time-ish comparison.
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;

  try {
    return fromB64Url(payload) || null;
  } catch {
    return null;
  }
}
