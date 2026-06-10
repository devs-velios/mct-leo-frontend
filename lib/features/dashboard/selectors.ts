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

/** Dossiers-by-stage → labelled donut segments (caller assigns colours). */
export function dossierStageSegments(stats: DashboardStats | null | undefined): DistributionSegment[] {
  return Object.entries(stats?.dossiers.by_stage ?? {}).map(([k, v]) => ({ value: v, label: STAGE_LABEL[k] ?? k }));
}
