// Client-side geocoding for the carte. Centres carry an address (ville/zip) but no
// lat/long, so we resolve city → coordinates via the free French government BAN API
// (api-adresse.data.gouv.fr — no key, CORS-open). Results are cached in memory and
// localStorage so each city is geocoded only once, ever.

export interface Coord {
  lat: number;
  lng: number;
}

const MEM = new Map<string, Coord | null>();
const LS_KEY = "mct_geocode_cache_v1";

function loadLS(): Record<string, Coord | null> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLS(key: string, val: Coord | null) {
  if (typeof window === "undefined") return;
  try {
    const all = loadLS();
    all[key] = val;
    window.localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {
    /* ignore quota/serialization errors */
  }
}

/**
 * Resolve a French place (city, optionally with a postal code) to coordinates.
 * Returns null when it can't be geocoded. Heavily cached.
 */
export async function geocode(query: string): Promise<Coord | null> {
  const key = query.trim().toLowerCase();
  if (!key) return null;
  if (MEM.has(key)) return MEM.get(key)!;

  const ls = loadLS();
  if (key in ls) {
    MEM.set(key, ls[key]);
    return ls[key];
  }

  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`,
    );
    const data = await res.json();
    const c = data?.features?.[0]?.geometry?.coordinates; // [lng, lat]
    const out: Coord | null = Array.isArray(c) ? { lng: c[0], lat: c[1] } : null;
    MEM.set(key, out);
    saveLS(key, out);
    return out;
  } catch {
    MEM.set(key, null);
    return null;
  }
}
