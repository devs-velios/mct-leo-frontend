// Dossiers feature — view-model mapping + domain selectors. Pipeline phase
// derivation, the relancer/bloqué/ouvert status rules, stage grouping, and trend
// bucketing all live here so the views (tables, kanban, charts) stay presentational.

import { type Dossier, type DossierListItem } from "./types";

// ── Backend → view-model mapping (GET /api/dossiers) ───────────────────────────
// Map etape_pipeline (micro stage) → the macro pipeline phase shown in the UI.
const STAGE_PHASE: Record<string, Dossier["phase"]> = {
  signature_validee: "Signature",
  plans_valides: "Onboarding",
  installation_qualite: "Onboarding",
  audit: "Dépôt",
  depot_agrement: "Dépôt",
  agrement_recu: "Dépôt",
  ouverture: "Ouvert",
};

/** Map a backend dossier row (with embedded centre) → the pipeline view's Dossier shape. */
export function dossierToRow(d: DossierListItem): Dossier {
  return {
    id: d.centre?.id ?? d.id, // navigate by centre id (detail view is centre-based)
    code: d.centre?.code_centre,
    centre: d.centre?.enseigne ?? d.centre?.code_centre ?? "—",
    ville: d.centre?.ville ?? "",
    gerant: "",
    phase: STAGE_PHASE[d.etape_pipeline] ?? "Onboarding",
    // Placeholder — DossiersView overrides this with the real value computed from the
    // centre's last_activity_at (the dossier payload alone carries no activity date).
    joursInactif: 0,
    signatureDate: new Date(d.created_at).toLocaleDateString("fr-FR"),
    ouvertureDate: "—",
    enseigne: "Indépendant",
    contact: "",
    dossierId: d.id,
    etape: d.etape_pipeline,
    macro: d.centre?.statut_ouverture,
  };
}

// The 7 regulatory pipeline stages (etape_pipeline) — board columns, in order.
export const PIPELINE_COLUMNS: { key: string; label: string }[] = [
  { key: "signature_validee", label: "Signature validée" },
  { key: "plans_valides", label: "Plans validés" },
  { key: "installation_qualite", label: "Installation & qualité" },
  { key: "audit", label: "Audit" },
  { key: "depot_agrement", label: "Dépôt agrément" },
  { key: "agrement_recu", label: "Agrément reçu" },
  { key: "ouverture", label: "Ouverture" },
];

// ── Status rules (single source of truth for the sub-filter tabs + stats) ──────
export const isRelancer = (d: Dossier) =>
  d.joursInactif >= 5 && d.phase !== "Ouvert" && d.phase !== "Suivi qualité";
export const isBloque = (d: Dossier) => d.joursInactif >= 14;
export const isOuvert = (d: Dossier) => d.phase === "Ouvert" || d.phase === "Suivi qualité";

export type DossierSubFilter = "tout" | "relancer" | "bloques" | "ouverts";

export function dossierStats(rows: Dossier[]) {
  return {
    total: rows.length,
    relancer: rows.filter(isRelancer).length,
    bloques: rows.filter(isBloque).length,
    ouverts: rows.filter(isOuvert).length,
  };
}

/** Apply the phase + free-text search + sub-filter tab to the pipeline rows. */
export function filterDossiers(
  rows: Dossier[],
  opts: { phase?: string; search?: string; subFilter?: DossierSubFilter; villes?: string[]; etape?: string },
): Dossier[] {
  const { phase = "all", search = "", subFilter = "tout", villes = [], etape } = opts;
  const query = search.trim().toLowerCase();
  return rows.filter((item) => {
    if (phase !== "all" && item.phase !== phase) return false;
    if (etape && item.etape !== etape) return false;
    if (villes.length > 0 && !villes.includes(item.ville)) return false;
    if (query) {
      const hit =
        item.id.toLowerCase().includes(query) ||
        item.centre.toLowerCase().includes(query) ||
        item.gerant.toLowerCase().includes(query) ||
        item.ville.toLowerCase().includes(query);
      if (!hit) return false;
    }
    if (subFilter === "relancer" && !isRelancer(item)) return false;
    if (subFilter === "bloques" && !isBloque(item)) return false;
    if (subFilter === "ouverts" && !isOuvert(item)) return false;
    return true;
  });
}

/**
 * Bucket pipeline rows into columns keyed by etape_pipeline. Defaults to the
 * regulatory PIPELINE_COLUMNS; pass MICRO_STAGES to group by the onboarding
 * pipeline the backend actually returns (onboarding, recuperation_documents, …).
 */
export function groupDossiersByStage(
  rows: Dossier[],
  columns: { key: string }[] = PIPELINE_COLUMNS,
): Record<string, Dossier[]> {
  const map: Record<string, Dossier[]> = {};
  for (const c of columns) map[c.key] = [];
  for (const r of rows) {
    if (r.etape && map[r.etape]) map[r.etape].push(r);
  }
  return map;
}

// ── Micro pipeline (onboarding sub-stages — draggable dossier-detail board) ────
// Canonical micro pipeline (etape_pipeline), in backend step_order. Source of
// truth: backend dossier_steps (step_order) / advance-stage targets.
export interface StageDef { key: string; label: string; }

export const MICRO_STAGES: StageDef[] = [
  { key: "onboarding", label: "Onboarding" },
  { key: "recuperation_documents", label: "Récupération des documents" },
  { key: "activation_outils", label: "Activation des outils" },
  { key: "suivi_projet", label: "Suivi de projet" },
  { key: "qualite_audit", label: "Qualité & audit" },
  { key: "demande_agrement", label: "Demande d'agrément" },
];
export const MICRO_KEYS = MICRO_STAGES.map((s) => s.key);

/** Human label for a micro-stage key (humanized fallback for any unexpected value). */
export const stageLabel = (key: string | null | undefined): string => {
  if (!key) return "—";
  const known = MICRO_STAGES.find((s) => s.key === key);
  return known ? known.label : key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
};

export const microNext = (k: string) => { const i = MICRO_KEYS.indexOf(k); return i >= 0 && i < MICRO_KEYS.length - 1 ? MICRO_KEYS[i + 1] : null; };
export const microPrev = (k: string) => { const i = MICRO_KEYS.indexOf(k); return i > 0 ? MICRO_KEYS[i - 1] : null; };
export const microToMacro = (k: string): string => {
  if (k === "qualite_audit") return "audit";
  if (k === "demande_agrement") return "agrement_en_cours";
  return "onboarding";
};

// ── Trend bucketing (dashboard "Nouveaux dossiers" chart) ──────────────────────
const DAY = 86_400_000;
const HOUR = 3_600_000;

export type TrendPeriodKey = "24h" | "7d" | "30d" | "90d" | "1an";

export const TREND_PERIODS: { key: TrendPeriodKey; label: string; windowMs: number; buckets: number; step: number }[] = [
  { key: "24h", label: "24 h", windowMs: DAY, buckets: 8, step: 3 * HOUR },
  { key: "7d", label: "7 j", windowMs: 7 * DAY, buckets: 7, step: DAY },
  { key: "30d", label: "30 j", windowMs: 30 * DAY, buckets: 10, step: 3 * DAY },
  { key: "90d", label: "90 j", windowMs: 90 * DAY, buckets: 12, step: 7.5 * DAY },
  { key: "1an", label: "1 an", windowMs: 365 * DAY, buckets: 12, step: (365 / 12) * DAY },
];

function trendLabel(period: TrendPeriodKey, end: number): string {
  const d = new Date(end);
  if (period === "24h") return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (period === "1an") return d.toLocaleDateString("fr-FR", { month: "short" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

/** Bucket dossiers by created_at into a time series for the given period (now = wall clock). */
export function dossiersTrend(
  rows: DossierListItem[],
  period: TrendPeriodKey,
  now: number,
): { name: string; dossiers: number }[] {
  const cfg = TREND_PERIODS.find((p) => p.key === period)!;
  const start0 = now - cfg.windowMs;
  const buckets = Array.from({ length: cfg.buckets }, (_, i) => {
    const end = start0 + (i + 1) * cfg.step;
    return { start: end - cfg.step, end, name: trendLabel(period, end), dossiers: 0 };
  });
  for (const d of rows) {
    const t = new Date(d.created_at).getTime();
    if (Number.isNaN(t) || t <= start0 || t > now) continue;
    const b = buckets.find((w) => t > w.start && t <= w.end);
    if (b) b.dossiers += 1;
  }
  return buckets.map((b) => ({ name: b.name, dossiers: b.dossiers }));
}
