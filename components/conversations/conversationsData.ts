// Types and mock data for the Conversations view.

export interface Message {
  sender: string;
  text: string;
  time: string;
  type: "ai" | "user"; // ai: left-aligned (Leo/Assistant), user: right-aligned (MCT Manager/Operator)
}

export interface Conversation {
  id: string;
  code?: string; // human-friendly code_centre (never show the raw UUID id)
  title: string;
  subtitle: string;
  phase: "Signature" | "Onboarding" | "Dépôt" | "Ouvert" | "Suivi";
  lastActivity: string;
  siret: string;
  denomination: string;
  adresse: string;
  signatureDate: string;
  ouvertureDate: string;
  gerant: string;
  phone: string;
  email: string;
  messages: Message[];
}

// ── Backend mapping ────────────────────────────────────────────────────────────
export interface InboxItem {
  centre_id: string;
  code_centre: string;
  enseigne: string | null;
  ville: string | null;
  statut_ouverture: string;
  message_count: number;
  last_message: { sender: string; contenu: string; received_at: string } | null;
}
export interface ApiMessage {
  id: string;
  sender: string;
  contenu: string;
  received_at: string;
}

const STATUT_PHASE_CONV: Record<string, Conversation["phase"]> = {
  onboarding: "Onboarding",
  audit: "Dépôt",
  agrement_en_cours: "Dépôt",
  ouvert: "Ouvert",
  bloque: "Onboarding"
};

export function inboxToConversation(i: InboxItem): Conversation {
  return {
    id: i.centre_id,
    code: i.code_centre,
    title: i.enseigne ?? i.code_centre,
    subtitle: `${i.code_centre}${i.ville ? ` - ${i.ville}` : ""}`,
    phase: STATUT_PHASE_CONV[i.statut_ouverture] ?? "Onboarding",
    lastActivity: i.last_message ? new Date(i.last_message.received_at).toLocaleString("fr-FR") : "—",
    siret: "",
    denomination: i.enseigne ?? "",
    adresse: "",
    signatureDate: "",
    ouvertureDate: "",
    gerant: "",
    phone: "",
    email: "",
    messages: []
  };
}

export function apiMessageToMsg(m: ApiMessage): Message {
  return {
    sender: m.sender === "leo" ? "Léo" : m.sender === "interne" ? "Interne" : "Client",
    text: m.contenu,
    time: new Date(m.received_at).toLocaleString("fr-FR"),
    type: m.sender === "leo" ? "ai" : "user"
  };
}

// 8 mockup conversations matching the screenshots exactly
export const initialConversations: Conversation[] = [
  {
    id: "13MARS",
    title: "13MARS - Mon Contrôle Technique Marseille",
    subtitle: "Mon Contrôle Technique Marseille - Marseille",
    phase: "Onboarding",
    lastActivity: "il y a environ 3 heures",
    siret: "123 456 789 00012",
    denomination: "CT MARSEILLE CENTRAL",
    adresse: "45 Avenue de Rome, 13006 Marseille",
    signatureDate: "12 mai 2026",
    ouvertureDate: "—",
    gerant: "Kamel ZOUBRI",
    phone: "+33 6 12 34 56 78",
    email: "kamel.zoubri@gmail.com",
    messages: [
      { sender: "Léo", text: "Bonjour Kamel, avez-vous pu réunir les pièces pour votre centre de Marseille ?", time: "il y a 3 heures", type: "ai" },
      { sender: "Kamel", text: "Oui, je viens de vous envoyer le Kbis par e-mail.", time: "il y a 2 heures", type: "user" }
    ]
  },
  {
    id: "TST70406",
    title: "TST70406 - Mon Contrôle Technique Copy",
    subtitle: "Mon Contrôle Technique Copy - TestCopy",
    phase: "Onboarding",
    lastActivity: "il y a 16 jours",
    siret: "987 654 321 00054",
    denomination: "CT COPY",
    adresse: "12 Rue de l'Onboarding, 75001 Paris",
    signatureDate: "10 mai 2026",
    ouvertureDate: "—",
    gerant: "Imrane",
    phone: "+33 6 88 99 00 11",
    email: "imrane@test.com",
    messages: [
      { sender: "Léo", text: "Bonjour Imrane, n'oubliez pas de signer le contrat d'onboarding pour commencer le processus.", time: "il y a 16 jours", type: "ai" },
      { sender: "Imrane", text: "Désolé pour le retard, je m'en occupe aujourd'hui.", time: "il y a 15 jours", type: "user" },
      { sender: "Léo", text: "Merci ! Une fois signé, nous pourrons planifier la visite initiale.", time: "il y a 15 jours", type: "ai" },
      { sender: "Imrane", text: "C'est signé et envoyé à l'instant, merci.", time: "il y a 15 jours", type: "user" }
    ]
  },
  {
    id: "ODO34",
    title: "ODO34 - Mon Contrôle Technique OPPORTUNITÉ...",
    subtitle: "Mon Contrôle Technique OPPORTUNITÉ DE IMRANE ABDOUL - Onboarding",
    phase: "Onboarding",
    lastActivity: "il y a 16 jours",
    siret: "—",
    denomination: "OPPORTUNITE IMRANE",
    adresse: "—",
    signatureDate: "—",
    ouvertureDate: "—",
    gerant: "Imrane abdoul",
    phone: "+33 6 11 22 33 44",
    email: "imrane.abdoul@gmail.com",
    messages: [
      { sender: "Léo", text: "Bonjour Imrane, l'opportunité a été créée dans Odoo. Nous attendons les documents d'identification du gérant.", time: "il y a 16 jours", type: "ai" }
    ]
  },
  {
    id: "TST669093",
    title: "TST669093 - Mon Contrôle Technique Test",
    subtitle: "Mon Contrôle Technique Test - TestVille",
    phase: "Onboarding",
    lastActivity: "il y a 16 jours",
    siret: "CT TEST SMOKE",
    denomination: "CT TEST SMOKE",
    adresse: "78 Rue du Test, 99000 TestVille",
    signatureDate: "13 mai 2026",
    ouvertureDate: "—",
    gerant: "Test smoke démo - Imrane TEST",
    phone: "+33787123910",
    email: "abdoulimrane740@gmail.com",
    messages: [
      {
        sender: "Léo",
        text: "Bonjour Imrane, je vois que votre dossier pour Mon Contrôle Technique Test à TestVille est en attente de trois documents : le Kbis, l'attestation d'assurance et une pièce d'identité. Pour finaliser votre agrément préfectoral, pourriez-vous nous les transmettre dès que possible ? Nous restons à votre disposition pour toute question ou aide dans la constitution du dossier. Merci par avance et bonne journée !",
        time: "il y a 16 jours",
        type: "ai"
      },
      {
        sender: "Imrane",
        text: "Si je n'ai pas mon agrément cette semaine je porte plainte, c'est du pur foutage de gueule",
        time: "il y a 16 jours",
        type: "user"
      },
      {
        sender: "Léo",
        text: "Je comprends votre frustration et je suis désolé pour la situation. Je vais transmettre votre message à votre commercial dédié qui reviendra vers vous rapidement pour faire le point sur l'avancement de votre dossier et trouver une solution.",
        time: "il y a 16 jours",
        type: "ai"
      },
      {
        sender: "Imrane",
        text: "Très bien, j'attends son appel avec impatience.",
        time: "il y a 16 jours",
        type: "user"
      }
    ]
  },
  {
    id: "LEORAG01",
    title: "LEORAG01 - Mon Contrôle Technique TEST LEO CA...",
    subtitle: "Mon Contrôle Technique TEST LEO CARDONNAY - Test",
    phase: "Onboarding",
    lastActivity: "il y a 17 jours",
    siret: "555 444 333 00011",
    denomination: "CT CARDONNAY",
    adresse: "12 Route de Lyon, 69002 Lyon",
    signatureDate: "08 mai 2026",
    ouvertureDate: "—",
    gerant: "Imrane TEST",
    phone: "+33 6 44 55 66 77",
    email: "imrane.test@gmail.com",
    messages: [
      { sender: "Léo", text: "Bonjour, le module de RAG est configuré sur votre dossier. Avez-vous des questions techniques sur le câblage de la ligne ?", time: "il y a 17 jours", type: "ai" }
    ]
  },
  {
    id: "ODO31",
    title: "ODO31 - Mon Contrôle Technique OPPORTUNITÉ D...",
    subtitle: "Mon Contrôle Technique OPPORTUNITÉ DE JEFF DOUCET",
    phase: "Onboarding",
    lastActivity: "il y a 21 jours",
    siret: "—",
    denomination: "CT OPPORTUNITE JEFF",
    adresse: "—",
    signatureDate: "—",
    ouvertureDate: "—",
    gerant: "Jeff DOUCET",
    phone: "+33 6 99 88 77 66",
    email: "jeff.doucet@gmail.com",
    messages: [
      { sender: "Léo", text: "Bonjour Jeff, nous attendons vos documents complémentaires pour valider la fiche Odoo.", time: "il y a 21 jours", type: "ai" }
    ]
  },
  {
    id: "ODO30",
    title: "ODO30 - Mon Contrôle Technique OPPORTUNITÉ...",
    subtitle: "Mon Contrôle Technique OPPORTUNITÉ DE HICHAM SAR",
    phase: "Onboarding",
    lastActivity: "il y a 22 jours",
    siret: "—",
    denomination: "CT HICHAM",
    adresse: "—",
    signatureDate: "—",
    ouvertureDate: "—",
    gerant: "Hicham SAR",
    phone: "+33 6 55 66 77 88",
    email: "hicham.sar@gmail.com",
    messages: [
      { sender: "Léo", text: "Bonjour Hicham, comment avance la signature du bail pour le local de contrôle ?", time: "il y a 22 jours", type: "ai" }
    ]
  },
  {
    id: "ODO28",
    title: "ODO28 - Mon Contrôle Technique OPPORTUNITÉ...",
    subtitle: "Mon Contrôle Technique OPPORTUNITÉ DE IMRANE ABDOUL",
    phase: "Onboarding",
    lastActivity: "il y a 22 jours",
    siret: "—",
    denomination: "CT IMRANE 28",
    adresse: "—",
    signatureDate: "—",
    ouvertureDate: "—",
    gerant: "Imrane ABDOUL",
    phone: "+33 6 11 22 33 44",
    email: "imrane.abdoul@gmail.com",
    messages: [
      { sender: "Léo", text: "Bonjour, dossier d'opportunité initialisé dans Léo. Nous allons planifier l'appel d'onboarding.", time: "il y a 22 jours", type: "ai" }
    ]
  }
];
