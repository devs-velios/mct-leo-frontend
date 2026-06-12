// Dashboard feature — derived metrics + chart segments over the KPI stats. Kept
// here so the dashboard cards/donuts stay presentational (colours + render only).

import { type DashboardStats } from "./types";

/** Derived KPI numbers from the raw stats payload (pieces pending / % verified / open centres). */
export function dashboardMetrics(stats: DashboardStats | null | undefined) {
  if (!stats) return { piecesPending: 0, pctVerified: 0, openCentres: 0 };
  const { total, verified } = stats.pieces;
  return {
    piecesPending: Math.max(0, total - verified),
    pctVerified: total > 0 ? Math.round((verified / total) * 100) : 0,
    openCentres: stats.centres.by_statut?.ouvert ?? 0,
  };
}

const STATUT_LABEL: Record<string, string> = {
  onboarding: "Onboarding",
  agrement_en_cours: "Agrément en cours",
  audit: "Audit",
  ouvert: "Ouvert",
  bloque: "Bloqué",
};

const STAGE_LABEL: Record<string, string> = {
  signature_validee: "Signature",
  plans_valides: "Plans",
  installation_qualite: "Installation",
  audit: "Audit",
  depot_agrement: "Dépôt",
  agrement_recu: "Agrément",
  ouverture: "Ouverture",
};

export interface DistributionSegment { value: number; label: string }

/** Centres-by-statut → labelled donut segments (caller assigns colours). */
export function centreStatutSegments(stats: DashboardStats | null | undefined): DistributionSegment[] {
  return Object.entries(stats?.centres.by_statut ?? {}).map(([k, v]) => ({ value: v, label: STATUT_LABEL[k] ?? k }));
}

/**
 * Centres-by-statut computed from the live centres list so EVERY centre is counted
 * — even when they sit at different pipeline phases. A centre's statut is resolved
 * from its current phase's macro_statut (via `macroByEtape`), unless it is already
 * `ouvert`/`bloque` (terminal statuts that don't come from a phase).
 */
export function centreStatutSegmentsFromCentres(
  centres: { statut_ouverture: string; etape_pipeline?: string | null }[],
  macroByEtape?: Map<string, string>,
): DistributionSegment[] {
  const counts = new Map<string, number>();
  for (const c of centres) {
    let key = c.statut_ouverture;
    if (key !== "ouvert" && key !== "bloque" && macroByEtape && c.etape_pipeline) {
      key = macroByEtape.get(c.etape_pipeline) ?? key;
    }
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([k, v]) => ({ value: v, label: STATUT_LABEL[k] ?? k }));
}

/** Dossiers-by-stage → labelled donut segments (caller assigns colours). */
export function dossierStageSegments(stats: DashboardStats | null | undefined): DistributionSegment[] {
  return Object.entries(stats?.dossiers.by_stage ?? {}).map(([k, v]) => ({ value: v, label: STAGE_LABEL[k] ?? k }));
}

// ── Creation trend (two series: new dossiers + new centres over a date range) ───
interface Dated { created_at: string }
export interface TrendPoint { name: string; dossiers: number; centres: number }

const DAY_MS = 86_400_000;

/** ≤30 even buckets across [start,end] with a short FR label per bucket end. */
function bucketEdges(start: number, end: number) {
  const span = Math.max(1, end - start);
  const days = Math.ceil(span / DAY_MS);
  const buckets = Math.max(1, Math.min(30, days));
  const step = span / buckets;
  const label = (t: number) => {
    const d = new Date(t);
    return days > 90
      ? d.toLocaleDateString("fr-FR", { month: "short" })
      : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  };
  return { buckets, step, label };
}

/** Bucket dossiers & centres by created_at into a 2-series time line for the range. */
export function creationTrend(dossiers: Dated[], centres: Dated[], start: number, end: number): TrendPoint[] {
  if (!(end > start)) return [];
  const { buckets, step, label } = bucketEdges(start, end);
  const out: TrendPoint[] = Array.from({ length: buckets }, (_, i) => ({
    name: label(start + (i + 1) * step),
    dossiers: 0,
    centres: 0,
  }));
  const tally = (rows: Dated[], key: "dossiers" | "centres") => {
    for (const r of rows) {
      const t = new Date(r.created_at).getTime();
      if (Number.isNaN(t) || t < start || t > end) continue;
      out[Math.min(buckets - 1, Math.floor((t - start) / step))][key] += 1;
    }
  };
  tally(dossiers, "dossiers");
  tally(centres, "centres");
  return out;
}

// ── Pipeline funnel (cumulative "reached at least", from the dynamic catalog) ───
export interface FunnelStep { name: string; label: string; value: number }

/** Distinct solid colours per phase (cycled if the catalog has more phases). */
export const FUNNEL_COLORS = [
  "#332151", "#E34F2D", "#2563EB", "#059669", "#D97706", "#7C3AED", "#0891B2", "#DB2777",
];

/**
 * Decreasing funnel from the dynamic pipeline catalog: each phase's value is the
 * number of centres that have REACHED AT LEAST that phase (cumulative), so the
 * shape never increases. `phases` come from the catalog; `centreEtapes` are the
 * centres' current `etape_pipeline`.
 */
export function pipelineFunnel(
  phases: { name: string; label: string; order: number }[],
  centreEtapes: (string | null | undefined)[],
): FunnelStep[] {
  const ordered = [...phases].sort((a, b) => a.order - b.order);
  const orderOf = new Map(ordered.map((p) => [p.name, p.order]));
  return ordered.map((p) => ({
    name: p.name,
    label: p.label,
    value: centreEtapes.filter((e) => e != null && (orderOf.get(e) ?? 0) >= p.order).length,
  }));
}

// ── Contract type (R / P) donut segments ───────────────────────────────────────
const CONTRAT_LABEL: Record<string, string> = { R: "Réseau (R)", P: "Partenaire (P)" };

export function contratSegments(centres: { type_contrat: string }[]): DistributionSegment[] {
  const counts = new Map<string, number>();
  for (const c of centres) {
    const k = (c.type_contrat ?? "").trim() || "—";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  // R first, P second, then any others — keeps the indigo/orange colour mapping stable.
  const rank = (k: string) => (k === "R" ? 0 : k === "P" ? 1 : 2);
  return [...counts.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]))
    .map(([k, v]) => ({ value: v, label: CONTRAT_LABEL[k] ?? k }));
}

// ── Activities (VL / CL / PL) as independent bars (a centre can combine several) ─
export interface ActiviteBar { activite: string; value: number }

export function activiteBars(centres: { activites: string[] }[], order = ["VL", "CL", "PL"]): ActiviteBar[] {
  const counts = new Map<string, number>();
  for (const c of centres) for (const a of c.activites ?? []) counts.set(a, (counts.get(a) ?? 0) + 1);
  const keys = [...new Set([...order, ...counts.keys()])];
  return keys.filter((k) => counts.has(k)).map((k) => ({ activite: k, value: counts.get(k) ?? 0 }));
}

// ── Documents per day (received-to-validate vs validated) ───────────────────────
export interface DocDayBar { name: string; aValider: number; valides: number }

/** Bucket pieces by date into per-day pending vs validated double bars. */
export function documentsPerDay(
  items: { createdAt?: string | null; status: string }[],
  start: number,
  end: number,
): DocDayBar[] {
  if (!(end > start)) return [];
  const { buckets, step, label } = bucketEdges(start, end);
  const out: DocDayBar[] = Array.from({ length: buckets }, (_, i) => ({
    name: label(start + (i + 1) * step),
    aValider: 0,
    valides: 0,
  }));
  for (const it of items) {
    if (!it.createdAt) continue;
    const t = new Date(it.createdAt).getTime();
    if (Number.isNaN(t) || t < start || t > end) continue;
    const b = out[Math.min(buckets - 1, Math.floor((t - start) / step))];
    if (it.status === "Validé") b.valides += 1;
    else if (it.status === "À valider" || it.status === "À identifier") b.aValider += 1;
  }
  return out;
}
