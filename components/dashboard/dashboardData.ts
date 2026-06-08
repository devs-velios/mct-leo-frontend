// Types and mock data for the main Dashboard page.

export interface DashboardDossier {
  id: string;
  code?: string; // human-friendly code_centre (never show the raw UUID id)
  enseigne: string;
  ville: string;
  gerant: string;
  phase: string;
  joursInactif: number;
  statut: string;
  contact: string;
}

export interface LiveActivity {
  id: number;
  centre: string;
  detail: string;
  temps: string;
  type: string;
}

// ── Backend mapping (GET /api/centres) ─────────────────────────────────────────
export interface CentreRow {
  id: string;
  code_centre: string;
  enseigne: string | null;
  ville: string | null;
  statut_ouverture: string;
  last_activity_at: string | null;
  contacts_clients?: unknown;
}

const STATUT_PHASE: Record<string, string> = {
  onboarding: "Onboarding",
  audit: "Audit",
  agrement_en_cours: "Dépôt Agrément",
  ouvert: "Ouvert",
  bloque: "Bloqué"
};

function firstPhone(contacts: unknown): string {
  if (!contacts || typeof contacts !== "object") return "";
  for (const v of Object.values(contacts as Record<string, unknown>)) {
    if (typeof v === "string" && /\d{8,}/.test(v.replace(/[\s.\-()]/g, ""))) return v;
  }
  return "";
}

/** Map a backend centre row → the dashboard table row shape. */
export function centreToDossier(c: CentreRow): DashboardDossier {
  const days = c.last_activity_at
    ? Math.max(0, Math.floor((Date.now() - new Date(c.last_activity_at).getTime()) / 86400000))
    : 0;
  return {
    id: c.id,
    code: c.code_centre,
    enseigne: c.enseigne ?? c.code_centre,
    ville: c.ville ?? "",
    gerant: "",
    phase: STATUT_PHASE[c.statut_ouverture] ?? "Onboarding",
    joursInactif: days,
    statut: days >= 5 ? "critique" : "normal",
    contact: firstPhone(c.contacts_clients)
  };
}

// Mock Data for centres needing attention
export const initialDossiers: DashboardDossier[] = [
  // 9 Onboarding dossiers (4 critiques, 5 normal)
  { id: "OD0201", enseigne: "Mon Contrôle Technique Paris Nord", ville: "Paris", gerant: "Kamel ZOUBRI", phase: "Onboarding", joursInactif: 0, statut: "normal", contact: "+33 6 12 34 56 78" },
  { id: "OD0300", enseigne: "Mon Contrôle Technique Lyon Centre", ville: "Lyon", gerant: "Marc Duboc", phase: "Onboarding", joursInactif: 0, statut: "normal", contact: "+33 6 23 45 67 89" },
  { id: "OD0999", enseigne: "Mon Contrôle Technique Marseille Est", ville: "Marseille", gerant: "Bourama KAMISSOKO", phase: "Onboarding", joursInactif: 0, statut: "normal", contact: "+33 6 34 56 78 90" },
  { id: "13MARS", enseigne: "Mon Contrôle Technique Marseille Centre", ville: "Marseille", gerant: "Kamel ZOUBRI", phase: "Onboarding", joursInactif: 22, statut: "critique", contact: "+33 6 11 22 33 44" },
  { id: "60KABO", enseigne: "Mon Contrôle Technique Beauvais Nord", ville: "Beauvais", gerant: "Bourama KAMISSOKO", phase: "Onboarding", joursInactif: 24, statut: "critique", contact: "+33 6 55 66 77 88" },
  { id: "76VESA", enseigne: "Mon Contrôle Technique Sannois", ville: "Sannois", gerant: "Imrane abdoul", phase: "Onboarding", joursInactif: 10, statut: "critique", contact: "+33 6 88 99 00 11" },
  { id: "OD0111", enseigne: "Mon Contrôle Technique Lille Ouest", ville: "Lille", gerant: "Caroline Dubois", phase: "Onboarding", joursInactif: 2, statut: "normal", contact: "+33 6 45 67 89 01" },
  { id: "OD0222", enseigne: "Mon Contrôle Technique Toulouse Est", ville: "Toulouse", gerant: "Jeff Doucet", phase: "Onboarding", joursInactif: 3, statut: "normal", contact: "+33 6 22 33 44 55" },
  { id: "OD0444", enseigne: "Mon Contrôle Technique Rennes Centre", ville: "Rennes", gerant: "Yann LION", phase: "Onboarding", joursInactif: 7, statut: "critique", contact: "+33 6 99 88 77 66" },

  // 9 Dépôt Agrément dossiers (5 critiques, 4 normal)
  { id: "33BORD", enseigne: "Mon Contrôle Technique Bordeaux Lac", ville: "Bordeaux", gerant: "Marc Duboc", phase: "Dépôt Agrément", joursInactif: 3, statut: "normal", contact: "+33 6 99 88 77 66" },
  { id: "31TOUL", enseigne: "Mon Contrôle Technique Toulouse Sud", ville: "Toulouse", gerant: "Jeff Doucet", phase: "Dépôt Agrément", joursInactif: 21, statut: "critique", contact: "+33 6 44 55 66 77" },
  { id: "34MONT", enseigne: "Mon Contrôle Technique Montpellier", ville: "Montpellier", gerant: "Julien BERTRAND", phase: "Dépôt Agrément", joursInactif: 1, statut: "normal", contact: "+33 6 45 67 89 01" },
  { id: "74TEST", enseigne: "Mon Contrôle Technique Annecy", ville: "Annecy", gerant: "CT ANNECY", phase: "Dépôt Agrément", joursInactif: 2, statut: "normal", contact: "+33 6 56 78 90 12" },
  { id: "83TOUL", enseigne: "Mon Contrôle Technique Toulon East", ville: "Toulon", gerant: "Hicham Sar", phase: "Dépôt Agrément", joursInactif: 12, statut: "critique", contact: "+33 6 22 33 44 55" },
  { id: "91EVRY", enseigne: "Mon Contrôle Technique Évry Courcouronnes", ville: "Évry", gerant: "Caroline Dubois", phase: "Dépôt Agrément", joursInactif: 8, statut: "critique", contact: "+33 6 66 77 88 99" },
  { id: "DA0555", enseigne: "Mon Contrôle Technique Nice Promenade", ville: "Nice", gerant: "Gérard Depieu", phase: "Dépôt Agrément", joursInactif: 15, statut: "critique", contact: "+33 6 12 34 56 78" },
  { id: "DA0666", enseigne: "Mon Contrôle Technique Nantes Loire", ville: "Nantes", gerant: "Sophie Martin", phase: "Dépôt Agrément", joursInactif: 6, statut: "critique", contact: "+33 6 23 45 67 89" },
  { id: "DA0777", enseigne: "Mon Contrôle Technique Strasbourg Gare", ville: "Strasbourg", gerant: "Thomas Klein", phase: "Dépôt Agrément", joursInactif: 0, statut: "normal", contact: "+33 6 34 56 78 90" }
];

export const liveActivities: LiveActivity[] = [
  { id: 1, centre: "13MARS - Mon Contrôle Technique...", detail: "Ouvrir un centre - Création - (13) Bouches-du-Rhône - ...", temps: "il y a 22 jours", type: "system" },
  { id: 2, centre: "60KABO - Mon Contrôle Technique...", detail: "Bourama KAMISSOKO - phase Onboarding", temps: "il y a 24 jours", type: "document" },
  { id: 3, centre: "TST70406 - Mon Contrôle Technique...", detail: "Test copy Léo - Imrane - phase Onboarding", temps: "il y a 10 jours", type: "whatsapp" },
  { id: 4, centre: "ODO34 - Mon Contrôle Technique...", detail: "Opportunité de Imrane abdoul - phase Onboarding", temps: "il y a 16 jours", type: "reminder" },
  { id: 5, centre: "TST669093 - Mon Contrôle Technique...", detail: "Test smoke démo - Imrane TEST - phase Onboarding", temps: "il y a 10 jours", type: "validation" },
  { id: 6, centre: "LEORAG01 - Mon Contrôle Technique...", detail: "TEST RAG LEO 76VESA - phase Onboarding", temps: "il y a 17 jours", type: "rag" }
  ];
