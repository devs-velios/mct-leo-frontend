// Types and mock data for the Dossiers (pipeline) view.

export interface Dossier {
  id: string;
  code?: string; // human-friendly code_centre (never show the raw UUID id)
  centre: string;
  ville: string;
  gerant: string;
  phase: "Signature" | "Onboarding" | "Dépôt" | "Ouvert" | "Suivi qualité";
  joursInactif: number;
  signatureDate: string;
  ouvertureDate: string;
  enseigne: "Norauto" | "Speedy" | "Feu Vert" | "Indépendant";
  contact: string;
  dossierId?: string; // real dossier UUID (for advance-stage)
  etape?: string; // micro status (etape_pipeline)
  macro?: string; // macro status (statut_ouverture)
}

// ── Backend mapping (GET /api/dossiers) ────────────────────────────────────────
const STAGE_PHASE: Record<string, Dossier["phase"]> = {
  signature_validee: "Signature",
  plans_valides: "Onboarding",
  installation_qualite: "Onboarding",
  audit: "Dépôt",
  depot_agrement: "Dépôt",
  agrement_recu: "Dépôt",
  ouverture: "Ouvert"
};

export interface DossierApi {
  id: string;
  etape_pipeline: string;
  created_at: string;
  centre: { id: string; code_centre: string; enseigne: string | null; ville: string | null; statut_ouverture: string } | null;
}

/** Map a backend dossier (with embedded centre) → the pipeline view's Dossier shape. */
export function dossierToRow(d: DossierApi): Dossier {
  return {
    id: d.centre?.id ?? d.id, // navigate by centre id (detail view is centre-based)
    code: d.centre?.code_centre,
    centre: d.centre?.enseigne ?? d.centre?.code_centre ?? "—",
    ville: d.centre?.ville ?? "",
    gerant: "",
    phase: STAGE_PHASE[d.etape_pipeline] ?? "Onboarding",
    joursInactif: 0,
    signatureDate: new Date(d.created_at).toLocaleDateString("fr-FR"),
    ouvertureDate: "—",
    enseigne: "Indépendant",
    contact: "",
    dossierId: d.id,
    etape: d.etape_pipeline,
    macro: d.centre?.statut_ouverture
  };
}

// 47 Mock Dossiers
export const initialDossiers: Dossier[] = [
  // 14 special mock dossiers visible in the screenshots
  { id: "OD0201", centre: "Mon Contrôle Technique TEST CACHE", ville: "Paris", gerant: "TEST CACHE", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 11 22 33 44" },
  { id: "OD0300", centre: "Mon Contrôle Technique TEST FINAL", ville: "Lyon", gerant: "TEST FINAL", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 22 33 44 55" },
  { id: "OD0999", centre: "Mon Contrôle Technique DIAG TEST", ville: "Marseille", gerant: "DIAG TEST", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 33 44 55 66" },
  { id: "34MONT", centre: "Mon Contrôle Technique Montpellier", ville: "Montpellier", gerant: "Julien BERTRAND", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Norauto", contact: "+33 6 44 55 66 77" },
  { id: "74TEST", centre: "Mon Contrôle Technique Annecy", ville: "Annecy", gerant: "CT ANNECY", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Speedy", contact: "+33 6 55 66 77 88" },
  { id: "OD09999", centre: "Mon Contrôle Technique CHECK", ville: "Bordeaux", gerant: "CHECK", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Feu Vert", contact: "+33 6 66 77 88 99" },
  { id: "OD077777", centre: "Mon Contrôle Technique AUDIT PROBE", ville: "Toulouse", gerant: "AUDIT PROBE", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 77 88 99 00" },
  { id: "99TEST", centre: "Mon Contrôle Technique TEST SHARED", ville: "Nantes", gerant: "Test Shared Drive", phase: "Onboarding", joursInactif: 0, signatureDate: "5 mai 2026", ouvertureDate: "—", enseigne: "Norauto", contact: "+33 6 88 99 00 11" },
  { id: "OD088898", centre: "Mon Contrôle Technique ROLLBACK CHECK", ville: "Strasbourg", gerant: "ROLLBACK CHECK", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 99 00 11 22" },
  { id: "OD0099", centre: "Mon Contrôle Technique MICHEL", ville: "Nice", gerant: "michel", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 12 34 56 78" },
  { id: "OD0042", centre: "Mon Contrôle Technique SOPHIE MARTIN", ville: "Rennes", gerant: "Sophie MARTIN", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 23 45 67 89" },
  { id: "OD0100", centre: "Mon Contrôle Technique TEST CACHE0", ville: "Lille", gerant: "Test cache0", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 34 56 78 90" },
  { id: "OD0101", centre: "Mon Contrôle Technique TEST CACHE1", ville: "Reims", gerant: "Test cache1", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 45 67 89 01" },
  { id: "OD0200", centre: "Mon Contrôle Technique TEST DEPLOY", ville: "Toulon", gerant: "TEST DEPLOY", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 56 78 90 12" },

  // Remaining 33 mock dossiers to make exactly 47
  { id: "OD0001", centre: "Mon Contrôle Technique Paris Est", ville: "Paris", gerant: "Kamel ZOUBRI", phase: "Onboarding", joursInactif: 2, signatureDate: "1 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 11 22 33 44" },
  { id: "OD0002", centre: "Mon Contrôle Technique Bordeaux Lac", ville: "Bordeaux", gerant: "Marc Duboc", phase: "Onboarding", joursInactif: 0, signatureDate: "4 mai 2026", ouvertureDate: "—", enseigne: "Norauto", contact: "+33 6 22 33 44 55" },
  { id: "OD0003", centre: "Mon Contrôle Technique Lille Centre", ville: "Lille", gerant: "Caroline Dubois", phase: "Onboarding", joursInactif: 8, signatureDate: "28 avril 2026", ouvertureDate: "—", enseigne: "Norauto", contact: "+33 6 33 44 55 66" },
  { id: "OD0004", centre: "Mon Contrôle Technique Lyon Nord", ville: "Lyon", gerant: "Jean Durand", phase: "Onboarding", joursInactif: 0, signatureDate: "2 mai 2026", ouvertureDate: "—", enseigne: "Norauto", contact: "+33 6 44 55 66 77" },
  { id: "OD0005", centre: "Mon Contrôle Technique Marseille Est", ville: "Marseille", gerant: "Bourama KAMISSOKO", phase: "Onboarding", joursInactif: 22, signatureDate: "10 avril 2026", ouvertureDate: "—", enseigne: "Speedy", contact: "+33 6 55 66 77 88" },
  { id: "OD0006", centre: "Mon Contrôle Technique Toulouse Sud", ville: "Toulouse", gerant: "Jeff Doucet", phase: "Onboarding", joursInactif: 12, signatureDate: "20 avril 2026", ouvertureDate: "—", enseigne: "Speedy", contact: "+33 6 66 77 88 99" },
  { id: "OD0007", centre: "Mon Contrôle Technique Nantes Loire", ville: "Nantes", gerant: "Sophie Martin", phase: "Onboarding", joursInactif: 0, signatureDate: "3 mai 2026", ouvertureDate: "—", enseigne: "Speedy", contact: "+33 6 77 88 99 00" },
  { id: "OD0008", centre: "Mon Contrôle Technique Strasbourg Gare", ville: "Strasbourg", gerant: "Thomas Klein", phase: "Onboarding", joursInactif: 5, signatureDate: "27 avril 2026", ouvertureDate: "—", enseigne: "Feu Vert", contact: "+33 6 88 99 00 11" },
  { id: "OD0009", centre: "Mon Contrôle Technique Nice Promenade", ville: "Nice", gerant: "Gérard Depieu", phase: "Onboarding", joursInactif: 0, signatureDate: "5 mai 2026", ouvertureDate: "—", enseigne: "Feu Vert", contact: "+33 6 99 00 11 22" },
  { id: "OD0010", centre: "Mon Contrôle Technique Rennes Ouest", ville: "Rennes", gerant: "Yann LION", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Feu Vert", contact: "+33 6 12 34 56 78" },
  { id: "OD0011", centre: "Mon Contrôle Technique Rouen Centre", ville: "Rouen", gerant: "Marie Leroux", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 23 45 67 89" },
  { id: "OD0012", centre: "Mon Contrôle Technique Dijon Sud", ville: "Dijon", gerant: "Pierre Alix", phase: "Onboarding", joursInactif: 1, signatureDate: "5 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 34 56 78 90" },
  { id: "OD0013", centre: "Mon Contrôle Technique Caen Nord", ville: "Caen", gerant: "Lucie Bernard", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 45 67 89 01" },
  { id: "OD0014", centre: "Mon Contrôle Technique Reims Gare", ville: "Reims", gerant: "Alexandre Petit", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 56 78 90 12" },
  { id: "OD0015", centre: "Mon Contrôle Technique Limoges Est", ville: "Limoges", gerant: "Nicolas Grand", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 11 22 33 44" },
  { id: "OD0016", centre: "Mon Contrôle Technique Angers Ouest", ville: "Angers", gerant: "Julie Perrin", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 22 33 44 55" },
  { id: "OD0017", centre: "Mon Contrôle Technique Mulhouse Centre", ville: "Mulhouse", gerant: "Emile Meyer", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 33 44 55 66" },
  { id: "OD0018", centre: "Mon Contrôle Technique Nancy Gare", ville: "Nancy", gerant: "François Schmitt", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 44 55 66 77" },
  { id: "OD0019", centre: "Mon Contrôle Technique Mulhouse Sud", ville: "Mulhouse", gerant: "Adrien Weber", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 55 66 77 88" },
  { id: "OD0020", centre: "Mon Contrôle Technique Tours Est", ville: "Tours", gerant: "Clara Simon", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 66 77 88 99" },
  { id: "OD0021", centre: "Mon Contrôle Technique Metz Nord", ville: "Metz", gerant: "Paul Wagner", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 77 88 99 00" },
  { id: "OD0022", centre: "Mon Contrôle Technique Besançon Est", ville: "Besançon", gerant: "Antoine Martin", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 88 99 00 11" },
  { id: "OD0023", centre: "Mon Contrôle Technique Orléans Centre", ville: "Orléans", gerant: "Sandrine Roy", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 99 00 11 22" },
  { id: "OD0024", centre: "Mon Contrôle Technique Rouen Sud", ville: "Rouen", gerant: "Laurent Colin", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 12 34 56 78" },
  { id: "OD0025", centre: "Mon Contrôle Technique Caen Centre", ville: "Caen", gerant: "Isabelle Duval", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 23 45 67 89" },
  { id: "OD0026", centre: "Mon Contrôle Technique Saint-Malo", ville: "Saint-Malo", gerant: "Yves Caradec", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 34 56 78 90" },
  { id: "OD0027", centre: "Mon Contrôle Technique Brest Centre", ville: "Brest", gerant: "Morgan Tanguy", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 45 67 89 01" },
  { id: "OD0028", centre: "Mon Contrôle Technique Lorient", ville: "Lorient", gerant: "Gaël Le Gall", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 56 78 90 12" },
  { id: "OD0029", centre: "Mon Contrôle Technique Vannes", ville: "Vannes", gerant: "Loïc Le Goff", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 11 22 33 44" },
  { id: "OD0030", centre: "Mon Contrôle Technique Quimper", ville: "Quimper", gerant: "Hervé Pennec", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 22 33 44 55" },
  { id: "OD0031", centre: "Mon Contrôle Technique Saint-Brieuc", ville: "Saint-Brieuc", gerant: "Alain Lucas", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 33 44 55 66" },
  { id: "OD0032", centre: "Mon Contrôle Technique Morlaix", ville: "Morlaix", gerant: "Corentin Gueguen", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 44 55 66 77" },
  { id: "OD0033", centre: "Mon Contrôle Technique Dinan", ville: "Dinan", gerant: "Erwan Jaffré", phase: "Onboarding", joursInactif: 0, signatureDate: "6 mai 2026", ouvertureDate: "—", enseigne: "Indépendant", contact: "+33 6 55 66 77 88" }
];
