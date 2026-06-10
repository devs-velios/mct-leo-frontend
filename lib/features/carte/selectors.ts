// Carte feature — map view-model + domain selectors. The backend→view mapping,
// coordinate projection/geocoding enrichment, region resolution, and the
// phase filter/counts live here so the map views stay presentational.

import { geocode } from "./geocode";
import { type CentreListItem, type CentreDetail } from "../centres/types";

export interface Center {
  id: string;
  code?: string; // human-friendly code_centre (never show the raw UUID id)
  enseigne: string;
  ville: string;
  gerant: string;
  phase: "Signature" | "Onboarding" | "Dépôt" | "Ouvert" | "Suivi";
  joursInactif: number;
  contact: string;
  email: string;
  siret: string;
  denomination: string;
  adresse: string;
  signatureDate: string;
  ouvertureDate: string;
  latitude: number;
  longitude: number;
  x: number; // SVG X position
  y: number; // SVG Y position
  completude: number; // Completion percentage
  documents: {
    kbis: "validé" | "manquant" | "en_cours";
    assurance: "validé" | "manquant" | "en_cours";
    identite: "validé" | "manquant" | "en_cours";
  };
  messages: { sender: string; text: string; time: string; type: "ai" | "user" | "operator" }[];
}

/** Project WGS84 lat/long → the map SVG's x/y coordinate space. */
export function projectCoords(lat: number, lng: number): { x: number; y: number } {
  const x = 40.47 * lng + 216.6;
  const y = -55.23 * lat + 2846.3;
  return { x: Math.round(x), y: Math.round(y) };
}

/** Resolve a city name → its administrative region id (for map region grouping). */
export function getRegionIdOfCenter(ville: string): string {
  const cityLower = ville.toLowerCase();
  if (cityLower.includes("paris") || cityLower.includes("testville")) return "ile-de-france";
  if (cityLower.includes("lyon") || cityLower.includes("annecy") || cityLower.includes("dijon")) return "auvergne-rhone-alpes";
  if (cityLower.includes("marseille") || cityLower.includes("nice") || cityLower.includes("toulon")) return "provence-alpes-cote-d-azur";
  if (cityLower.includes("montpellier") || cityLower.includes("toulouse")) return "occitanie";
  if (cityLower.includes("bordeaux")) return "nouvelle-aquitaine";
  if (cityLower.includes("nantes")) return "pays-de-la-loire";
  if (cityLower.includes("strasbourg")) return "grand-est";
  if (cityLower.includes("rennes")) return "bretagne";
  if (cityLower.includes("lille") || cityLower.includes("rouen")) return "hauts-de-france";
  if (cityLower.includes("reims")) return "grand-est";
  return "ile-de-france";
}

// ── Backend mapping (GET /api/centres → map pins) ──────────────────────────────
const STATUT_PHASE_CARTE: Record<string, Center["phase"]> = {
  onboarding: "Onboarding",
  audit: "Dépôt",
  agrement_en_cours: "Dépôt",
  ouvert: "Ouvert",
  bloque: "Onboarding",
};

export interface CentreApiGeo {
  id: string;
  code_centre: string;
  enseigne: string | null;
  ville: string | null;
  statut_ouverture: string;
  latitude: number | null;
  longitude: number | null;
  contacts_clients?: Record<string, unknown>;
}

/** Map real centres (with lat/long) → the map's Center shape, projecting coords to x/y. */
export function centresToCarte(list: CentreApiGeo[]): Center[] {
  return list
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => {
      const { x, y } = projectCoords(c.latitude as number, c.longitude as number);
      const vals = Object.values(c.contacts_clients ?? {}).filter((v): v is string => typeof v === "string");
      return {
        id: c.id,
        code: c.code_centre,
        enseigne: c.enseigne ?? c.code_centre,
        ville: c.ville ?? "",
        gerant: "",
        phase: STATUT_PHASE_CARTE[c.statut_ouverture] ?? "Onboarding",
        joursInactif: 0,
        contact: vals.find((v) => /\d{8,}/.test(v.replace(/\D/g, ""))) ?? "",
        email: vals.find((v) => v.includes("@")) ?? "",
        siret: "",
        denomination: c.enseigne ?? "",
        adresse: "",
        signatureDate: "",
        ouvertureDate: "",
        latitude: c.latitude as number,
        longitude: c.longitude as number,
        x,
        y,
        completude: 0,
        documents: { kbis: "manquant", assurance: "manquant", identite: "manquant" },
        messages: [],
      } as Center;
    });
}

/**
 * Resolve map pins from the centres list. The backend geocodes centres (lat/long);
 * we use those directly and only fall back to client-side geocoding for centres not
 * yet geocoded. Centres landing on the same point get a small golden-angle spiral
 * offset so their pins don't overlap.
 */
export async function enrichCentresWithCoords(centres: CentreListItem[]): Promise<Center[]> {
  const missingVilles = [
    ...new Set(
      centres
        .filter((c) => c.latitude == null || c.longitude == null)
        .map((c) => (c.ville ?? "").trim())
        .filter(Boolean),
    ),
  ];
  const fallback = new Map<string, { lat: number; lng: number } | null>();
  await Promise.all(missingVilles.map(async (v) => { fallback.set(v.toLowerCase(), await geocode(v)); }));

  const perPoint = new Map<string, number>();
  const enriched = centres.map((c) => {
    let lat = c.latitude ?? null;
    let lng = c.longitude ?? null;
    if (lat == null || lng == null) {
      const g = c.ville ? fallback.get(c.ville.trim().toLowerCase()) : null;
      if (g) { lat = g.lat; lng = g.lng; }
    }
    if (lat == null || lng == null) return { ...c, latitude: null, longitude: null };
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const n = perPoint.get(key) ?? 0;
    perPoint.set(key, n + 1);
    const angle = n * 2.399963; // golden angle
    const r = n === 0 ? 0 : 0.012 * Math.sqrt(n); // ~1 km steps
    return { ...c, latitude: lat + r * Math.cos(angle), longitude: lng + r * Math.sin(angle) };
  });
  return centresToCarte(enriched as CentreApiGeo[]);
}

// ── Phase filter + counts ──────────────────────────────────────────────────────
const FILTER_PHASE: Record<string, Center["phase"]> = {
  Signature: "Signature",
  Onboarding: "Onboarding",
  "Dépôt agrément": "Dépôt",
  Ouvert: "Ouvert",
  Suivi: "Suivi",
};

export function filterCentresByPhase(centers: Center[], filter: string): Center[] {
  if (filter === "Toutes phases") return centers;
  const phase = FILTER_PHASE[filter];
  return phase ? centers.filter((c) => c.phase === phase) : centers;
}

export function centreCounts(centers: Center[]) {
  return {
    total: centers.length,
    signature: centers.filter((c) => c.phase === "Signature").length,
    onboarding: centers.filter((c) => c.phase === "Onboarding").length,
    depot: centers.filter((c) => c.phase === "Dépôt").length,
    ouvert: centers.filter((c) => c.phase === "Ouvert").length,
    suivi: centers.filter((c) => c.phase === "Suivi").length,
  };
}

// ── Hovered-pin info + coverage stats (CarteListingView) ───────────────────────
/** Normalize the hovered centre's detail payload into the map info-card view-model. */
export function hoveredCentreInfo(detail: CentreDetail | undefined | null) {
  if (!detail) return null;
  const c = detail.centre;
  const vals = Object.values(c?.contacts_clients ?? {}).filter((v): v is string => typeof v === "string");
  const present = detail.pieces_stats?.present ?? 0;
  const missing = detail.pieces_stats?.missing ?? 0;
  const total = present + missing;
  return {
    type: c?.type_contrat === "P" ? "Premium" : "Réseau",
    activites: (c?.activites ?? []) as string[],
    etape: detail.dossiers?.[0]?.etape_pipeline ?? "",
    adresse: [c?.street, c?.zip, c?.ville].filter(Boolean).join(", "),
    phone: vals.find((v) => /\d{8,}/.test(v.replace(/\D/g, ""))) ?? "",
    email: vals.find((v) => v.includes("@")) ?? "",
    present,
    missing,
    completeness: total > 0 ? Math.round((present / total) * 100) : 0,
    openAlerts: (detail.alerts ?? []).filter((a) => a.status === "open").length,
    pendingReminders: (detail.reminders ?? []).filter((r) => r.status === "pending").length,
  };
}

/** Coverage stats over the (filtered) map pins: active sites, regions covered, recent activity. */
export function carteStats(centers: Center[]) {
  return {
    activeSites: centers.filter((c) => c.phase === "Onboarding" || c.phase === "Ouvert").length,
    coverageRegions: new Set(centers.map((c) => getRegionIdOfCenter(c.ville))).size,
    recentActivity: centers.filter((c) => c.joursInactif === 0).length,
  };
}

/** Count map pins whose city falls inside the given region id. */
export function centersInRegion(centers: Center[], regionId: string | null): number {
  if (!regionId) return 0;
  return centers.filter((c) => getRegionIdOfCenter(c.ville) === regionId).length;
}
