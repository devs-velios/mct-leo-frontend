"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  MessageSquare,
  Clock,
  FileText,
  FileCheck,
  Award,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Users,
  Menu,
  Calculator,
  ArrowRightCircle,
  Play,
  RotateCcw,
  Smartphone,
  Eye,
  Check
} from "lucide-react";

interface FonctionnementViewProps {
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function FonctionnementView({ setMobileMenuOpen }: FonctionnementViewProps) {
  // Steps state
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // ROI Calculator state
  const [centresCount, setCentresCount] = useState(5);

  const steps = [
    {
      number: 1,
      title: "Signature — Création du groupe WhatsApp",
      shortTitle: "Signature & WhatsApp",
      description: "Dès la signature du contrat d'adhésion au réseau MonControleTechnique, l'IA Léo prend en charge le dossier. Elle initialise les informations dans le CRM (Odoo) et crée automatiquement le canal de communication principal.",
      bullets: [
        "Groupe WhatsApp dédié créé instantanément.",
        "Message d'accueil et d'introduction de l'IA Léo envoyé au gérant.",
        "Lien d'accès unique généré pour l'espace d'onboarding gérant."
      ],
      icon: MessageSquare,
      themeColor: "from-[#2D2A56] to-[#1E1D3B]"
    },
    {
      number: 2,
      title: "Relance des pièces manquantes",
      shortTitle: "Relance WhatsApp",
      description: "Pour éviter l'enlisement administratif, Léo effectue un suivi proactif quotidien du dossier. Elle vérifie quelles pièces réglementaires sont encore nécessaires et sollicite le gérant de manière ciblée.",
      bullets: [
        "Relance automatique et douce via WhatsApp (pas de harcèlement).",
        "Liste synthétique et claire des documents requis transmise régulièrement.",
        "Instructions simples pour la numérisation des justificatifs."
      ],
      icon: Clock,
      themeColor: "from-amber-500 to-[#EA5B2D]"
    },
    {
      number: 3,
      title: "Documents reçus — parsing et transcription",
      shortTitle: "Parsing & Transcription",
      description: "Lorsque le gérant dépose ses documents (par WhatsApp ou l'espace d'onboarding), l'intelligence artificielle de Léo analyse, extrait et transcrit les données en quelques secondes.",
      bullets: [
        "Parsing OCR intelligent (Kbis, attestations d'assurance, pièce d'identité).",
        "Remplissage et mise à jour automatique des fiches dossiers dans Odoo.",
        "Alerte immédiate en cas de document flou, incomplet ou expiré."
      ],
      icon: FileText,
      themeColor: "from-[#EA5B2D] to-rose-600"
    },
    {
      number: 4,
      title: "Génération du dossier d'agrément",
      shortTitle: "Dossier d'agrément",
      description: "Dès que toutes les pièces nécessaires sont collectées et validées par les équipes, Léo compile et met en page le dossier réglementaire destiné à la DREAL/DRIEETS.",
      bullets: [
        "Génération automatisée des formulaires officiels Cerfa pré-remplis.",
        "Regroupement ordonné de toutes les pièces justificatives au format requis.",
        "Envoi du dossier d'agrément prêt à être signé et transmis."
      ],
      icon: FileCheck,
      themeColor: "from-emerald-500 to-teal-700"
    },
    {
      number: 5,
      title: "Suivi post-ouverture et Qualité",
      shortTitle: "Suivi & Qualité",
      description: "L'accompagnement de Léo ne s'arrête pas à l'ouverture du centre. Elle continue d'assurer le suivi qualité post-onboarding pour aider le centre à maintenir sa conformité.",
      bullets: [
        "Rappels automatisés pour les audits périodiques de qualité.",
        "Collecte et suivi des pièces de renouvellement des contrôleurs agréés.",
        "Canal d'assistance permanent disponible pour le gérant."
      ],
      icon: Award,
      themeColor: "from-indigo-500 to-[#2D2A56]"
    }
  ];

  const advantages = [
    {
      title: "Pas de groupes WhatsApp perdus",
      description: "Chaque centre dispose de son canal de discussion WhatsApp structuré et relié directement à la plateforme centrale Léo. Rien ne se perd dans les conversations personnelles.",
      icon: Users,
      glow: "hover:shadow-[0_20px_40px_rgba(45,42,86,0.1),0_0_20px_rgba(45,42,86,0.05)] hover:border-[#2D2A56]/20"
    },
    {
      title: "Zéro double saisie",
      description: "Les documents envoyés par le gérant sont automatiquement parsés par l'IA et insérés dans Odoo. Plus aucun copier-coller manuel n'est requis de la part de vos équipes.",
      icon: Zap,
      glow: "hover:shadow-[0_20px_40px_rgba(234,91,45,0.1),0_0_20px_rgba(234,91,45,0.05)] hover:border-[#EA5B2D]/20"
    },
    {
      title: "Relance douce (WhatsApp)",
      description: "L'IA relance le gérant directement sur son téléphone via WhatsApp avec des messages naturels et polis, garantissant des taux de réponse 3x supérieurs à l'e-mail.",
      icon: Sparkles,
      glow: "hover:shadow-[0_20px_40px_rgba(234,91,45,0.1),0_0_20px_rgba(234,91,45,0.05)] hover:border-[#EA5B2D]/20"
    },
    {
      title: "Formulaires pré-remplis",
      description: "Les formulaires de demande d'agrément préfectoraux sont remplis automatiquement à 100% avec les données extraites des Kbis et pièces d'identité du dossier.",
      icon: FileText,
      glow: "hover:shadow-[0_20px_40px_rgba(79,70,229,0.1),0_0_20px_rgba(79,70,229,0.05)] hover:border-indigo-500/20"
    },
    {
      title: "Relance WhatsApp bidirectionnelle",
      description: "Le gérant peut poser ses questions directement dans le chat WhatsApp. L'IA Léo y répond instantanément 24h/24 ou transfère le ticket à un conseiller humain si nécessaire.",
      icon: Cpu,
      glow: "hover:shadow-[0_20px_40px_rgba(79,70,229,0.1),0_0_20px_rgba(79,70,229,0.05)] hover:border-indigo-500/20"
    },
    {
      title: "Ouverture rapide",
      description: "Grâce à l'automatisation des tâches chronophages et au suivi quotidien de Léo, la durée moyenne d'onboarding d'un centre est réduite de 14 jours.",
      icon: ShieldCheck,
      glow: "hover:shadow-[0_20px_40px_rgba(16,185,129,0.1),0_0_20px_rgba(16,185,129,0.05)] hover:border-emerald-500/20"
    }
  ];

  // Auto play stages
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const selectStep = (idx: number) => {
    setIsAutoPlaying(false);
    setActiveStep(idx);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8F9FB] w-full min-w-0">
      
      {/* Header Area */}
      <header className="px-4 sm:px-6 py-4 bg-white border-b border-slate-100 shrink-0 relative z-10 w-full min-w-0">
        {setMobileMenuOpen && (
          <div className="flex items-center justify-between md:hidden mb-2 w-full">
            <span className="font-serif-mct text-lg font-bold text-[#2D2A56]">MCT Léo</span>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}
        <h2 className="text-2xl font-bold font-serif-mct text-[#2D2A56] tracking-tight">
          Comment fonctionne Léo ?
        </h2>
        <p className="text-xs text-[#5A5A7A] mt-0.5">
          Découvrez la synergie entre WhatsApp, l'IA et vos équipes de validation.
        </p>
      </header>

      {/* Main workspace scrollable area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-12 w-full custom-scrollbar pb-24">
        <div className="max-w-[1400px] mx-auto space-y-12">

          {/* 1. Hero Block: Glowing interactive design */}
          <div className="rounded-3xl bg-gradient-to-br from-[#2D2A56] to-[#1E1D3B] text-white p-6 md:p-10 relative overflow-hidden shadow-[0_10px_30px_rgba(45,42,86,0.1)] border border-[#2D2A56]/30">
            {/* Ambient gradients */}
            <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#EA5B2D]/20 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="space-y-4 lg:col-span-7">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#EA5B2D] text-[10px] font-extrabold tracking-widest uppercase">
                  <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
                  Plateforme Unifiée Onboarding
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold font-serif-mct tracking-tight leading-tight">
                  L'intelligence au service de votre réseau
                </h1>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-xl font-medium">
                  MonControleTechnique orchestre l'ouverture de vos centres en automatisant les tâches les plus lourdes. L'IA Léo relance les gérants, pré-remplit les Cerfa administratifs et met à jour Odoo de façon autonome.
                </p>
              </div>
              <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
                {/* Floating graphic mock */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#EA5B2D]/10 to-indigo-500/10 rounded-full blur-xl animate-pulse" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    className="absolute w-56 h-56 rounded-full border border-white/5 border-dashed flex items-center justify-center"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    className="absolute w-44 h-44 rounded-full border border-[#EA5B2D]/20 border-dashed flex items-center justify-center"
                  />
                  {/* Central Glow Core */}
                  <div className="relative h-28 w-28 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center shadow-inner z-10">
                    <Cpu className="h-8 w-8 text-[#EA5B2D] mb-1.5" />
                    <span className="text-[10px] font-extrabold tracking-widest uppercase text-white/95">MCT IA CORE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Interactive Split-Screen Step Simulator (Not AI-type template, fully custom) */}
          <section className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">
                SIMULATEUR INTERACTIF
              </span>
              <h2 className="text-2xl md:text-3xl font-bold font-serif-mct text-[#2D2A56]">
                5 étapes, une seule narration
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-semibold">
                Sélectionnez une étape pour observer l'IA Léo interagir en temps réel.
              </p>
            </div>

            {/* Stage Selector Tabs */}
            <div className="flex flex-wrap justify-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl max-w-3xl mx-auto border border-slate-200/50">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = activeStep === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => selectStep(idx)}
                    className={`flex items-center gap-2 px-3 py-2 text-[10px] md:text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "bg-[#2D2A56] text-white shadow-md"
                        : "text-[#5A5A7A] hover:bg-white hover:text-[#2D2A56]"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#EA5B2D]" : ""}`} />
                    <span className="hidden sm:inline">{step.shortTitle}</span>
                    <span className="sm:hidden">{step.number}</span>
                  </button>
                );
              })}
            </div>

            {/* Split Screen Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Column: Description card of the active step */}
              <div className="lg:col-span-5 flex flex-col justify-between bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 md:p-8 relative overflow-hidden group">
                {/* Shine Sweep */}
                <div className="absolute inset-0 w-[150%] h-full bg-gradient-to-r from-transparent via-slate-100/40 to-transparent -skew-x-20 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#EA5B2D] bg-[#EA5B2D]/10 px-3 py-1 rounded-full border border-[#EA5B2D]/20">
                      Étape {steps[activeStep].number} sur 5
                    </span>
                    {isAutoPlaying && (
                      <span className="flex items-center gap-1 text-[8.5px] font-bold text-emerald-600 animate-pulse bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        Lecture automatique
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-extrabold text-[#2D2A56] font-serif-mct tracking-tight">
                    {steps[activeStep].title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    {steps[activeStep].description}
                  </p>

                  <div className="space-y-2.5 pt-4 border-t border-slate-50">
                    <span className="block text-[8px] font-extrabold uppercase tracking-wider text-[#5A5A7A] mb-1">
                      FONCTIONNALITÉS CLÉS
                    </span>
                    {steps[activeStep].bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#EA5B2D] shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-700 font-bold leading-tight">
                          {bullet}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <button
                    onClick={() => selectStep((activeStep - 1 + steps.length) % steps.length)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => selectStep((activeStep + 1) % steps.length)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#2D2A56] text-[10px] font-bold text-white hover:bg-[#1E1D3B] cursor-pointer flex items-center gap-1"
                  >
                    Suivant
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive device preview simulation */}
              <div className="lg:col-span-7 bg-[#2D2A56] rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-lg border border-white/5 min-h-[350px] sm:min-h-[420px]">
                {/* Glowing spots */}
                <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-[#EA5B2D]/10 blur-2xl pointer-events-none" />
                <div className="absolute bottom-10 left-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

                <AnimatePresence mode="wait">
                  {/* Step 1: Signature & WhatsApp onboarding setup */}
                  {activeStep === 0 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full max-w-sm bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col h-[320px] sm:h-[350px]"
                    >
                      {/* WhatsApp Mock Header */}
                      <div className="bg-slate-800 px-4 py-3 border-b border-white/5 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#EA5B2D]/10 border border-[#EA5B2D]/20 flex items-center justify-center text-[#EA5B2D] font-extrabold text-[10px]">
                          L
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-white leading-tight">Léo · MonContrôleTechnique</div>
                          <div className="text-[8px] text-emerald-400 font-bold flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse"></span>
                            En ligne
                          </div>
                        </div>
                      </div>
                      
                      {/* Chat Messages */}
                      <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar flex flex-col justify-end bg-slate-950">
                        {/* Bubble 1 */}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className="bg-slate-800 text-white p-3 rounded-2xl rounded-tl-none text-[10px] max-w-[85%] leading-relaxed border border-white/5 shadow-sm font-semibold"
                        >
                          Bonjour ! Je suis Léo, votre assistant IA MonContrôleTechnique. Félicitations pour l'adhésion de votre centre ! 🚀
                        </motion.div>
                        {/* Bubble 2 */}
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.2 }}
                          className="bg-slate-800 text-white p-3 rounded-2xl rounded-tl-none text-[10px] max-w-[85%] leading-relaxed border border-white/5 shadow-sm font-semibold"
                        >
                          Je vais vous accompagner dans toutes les démarches d'onboarding. Voici votre lien d'accès unique : <span className="text-[#EA5B2D] underline">app.mct.fr/onboarding</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Documents list requests */}
                  {activeStep === 1 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full max-w-sm bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col h-[320px] sm:h-[350px]"
                    >
                      {/* WhatsApp Mock Header */}
                      <div className="bg-slate-800 px-4 py-3 border-b border-white/5 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#EA5B2D]/10 border border-[#EA5B2D]/20 flex items-center justify-center text-[#EA5B2D] font-extrabold text-[10px]">
                          L
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-white leading-tight">Léo · MonContrôleTechnique</div>
                          <div className="text-[8px] text-emerald-400 font-bold flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse"></span>
                            En ligne
                          </div>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar flex flex-col justify-end bg-slate-950">
                        {/* Bubble 1 */}
                        <div className="bg-slate-800 text-white p-3 rounded-2xl rounded-tl-none text-[10px] max-w-[85%] leading-relaxed border border-white/5 shadow-sm font-semibold">
                          Bonjour ! Il nous manque les documents suivants pour finaliser votre agrément : 1. Extrait Kbis (de moins de 3 mois), 2. Attestation d'assurance RC Pro. Vous pouvez me les envoyer directement en photo ici ! 📸
                        </div>
                        {/* User reply bubble */}
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 }}
                          className="bg-emerald-600 text-white p-2.5 rounded-2xl rounded-tr-none text-[10px] max-w-[80%] self-flex-end ml-auto border border-emerald-500/20 shadow-sm flex items-center gap-2 font-semibold"
                        >
                          <FileText className="h-4 w-4 shrink-0 text-white" />
                          <span>kbis_centre.jpg (2.1 Mo)</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: OCR Parsing Mock */}
                  {activeStep === 2 && (
                    <motion.div
                      key="step-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full max-w-md bg-slate-900 rounded-3xl p-5 border border-white/10 shadow-2xl space-y-4"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4.5 w-4.5 text-[#EA5B2D] animate-pulse" />
                          <span className="text-[11px] font-extrabold tracking-wider text-white uppercase">ANALYSE OCR EN DIRECT</span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Active</span>
                      </div>

                      {/* Mock Document Screen */}
                      <div className="relative bg-slate-950 border border-white/5 rounded-2xl p-4 overflow-hidden h-[180px] flex flex-col justify-between">
                        {/* Scanning Line overlay */}
                        <motion.div
                          animate={{ top: ["0%", "95%", "0%"] }}
                          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                          className="absolute left-0 right-0 h-0.5 bg-[#EA5B2D] shadow-[0_0_10px_#EA5B2D] z-10 pointer-events-none"
                        />
                        
                        <div className="space-y-2 relative z-0">
                          <div className="h-3 w-1/3 bg-white/10 rounded"></div>
                          <div className="h-2.5 w-3/4 bg-white/5 rounded"></div>
                          <div className="h-2.5 w-1/2 bg-white/5 rounded"></div>
                        </div>

                        {/* OCR Detected Data Fields */}
                        <div className="grid grid-cols-2 gap-2 text-[9px] font-bold relative z-20">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/5 p-2 rounded border border-white/5"
                          >
                            <span className="block text-slate-400 text-[7px] uppercase mb-0.5">ENSEIGNE</span>
                            <span className="text-white font-extrabold">MCT LILLE</span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="bg-white/5 p-2 rounded border border-white/5"
                          >
                            <span className="block text-slate-400 text-[7px] uppercase mb-0.5">SIRET</span>
                            <span className="text-white font-extrabold">893 218 092</span>
                          </motion.div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1">
                        <span>Extractions validées : 3/3</span>
                        <span className="text-[#EA5B2D]">Précision global : 99.4%</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Cerfa / Agreement Dossier Generation */}
                  {activeStep === 3 && (
                    <motion.div
                      key="step-4"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full max-w-sm bg-slate-900 rounded-3xl p-5 border border-white/10 shadow-2xl flex flex-col justify-between h-[280px]"
                    >
                      <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                        <FileCheck className="h-4.5 w-4.5 text-emerald-400" />
                        <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">COMPILATION DE L'AGRÉMENT</span>
                      </div>

                      {/* PDF Graphic Representation */}
                      <div className="py-4 flex flex-col items-center justify-center gap-2">
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="h-16 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400"
                        >
                          <FileText className="h-8 w-8" />
                        </motion.div>
                        <span className="text-[10px] font-bold text-white text-center">Dossier_Agreement_MCT_Lille.pdf</span>
                        <span className="text-[8px] font-semibold text-slate-400">Cerfa 14009*02 pré-rempli à 100%</span>
                      </div>

                      <div className="space-y-2">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3 }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                          <span>Compilation réussie</span>
                          <span className="text-emerald-400 font-extrabold">PRÊT À L'ENVOI</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: Post-opening quality checklists */}
                  {activeStep === 4 && (
                    <motion.div
                      key="step-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="w-full max-w-sm bg-slate-900 rounded-3xl p-5 border border-white/10 shadow-2xl space-y-4"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Award className="h-4.5 w-4.5 text-indigo-400" />
                          <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">CONTRÔLE DE QUALITÉ & SUIVI</span>
                        </div>
                      </div>

                      <div className="space-y-2.5 text-[10px] font-semibold text-slate-300">
                        {/* Item 1 */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Audit Qualité Périodique (DREAL)</span>
                          </div>
                          <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Dans 3 mois</span>
                        </div>
                        {/* Item 2 */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Renouvellement Agrément Contrôleurs</span>
                          </div>
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-extrabold">À jour</span>
                        </div>
                        {/* Item 3 */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-2">
                            <motion.span
                              animate={{ opacity: [1, 0.4, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"
                            />
                            <span>Assistance Ticket Direct (WhatsApp)</span>
                          </div>
                          <span className="text-[8px] text-[#EA5B2D] font-extrabold">24/7 ACTIF</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </section>

          {/* 3. Interactive ROI & Savings Simulator (WOW Factor, Not AI template) */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#EA5B2D]" />
              <h3 className="text-xl font-bold font-serif-mct text-[#2D2A56]">
                Simulateur de rentabilité administrative
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed font-semibold">
              Estimez le gain de temps et l'économie financière de votre réseau en ajustant le curseur sur votre nombre de centres en cours d'onboarding.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 items-center">
              {/* Slider Input (Left) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex justify-between items-center font-bold text-xs">
                  <span className="text-slate-600">Centres dans votre pipeline</span>
                  <span className="text-lg text-[#EA5B2D] font-serif-mct">{centresCount} centres</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={centresCount}
                  onChange={(e) => setCentresCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#EA5B2D]"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-extrabold">
                  <span>1 CENTRE</span>
                  <span>25 CENTRES</span>
                  <span>50 CENTRES</span>
                </div>
              </div>

              {/* Dynamic Simulated Calculations (Right) */}
              <div className="lg:col-span-6 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2D2A56] to-[#1E1D3B] text-white space-y-1">
                  <span className="block text-[8px] font-extrabold uppercase tracking-widest text-slate-300">ÉCONOMIE FINANCIÈRE</span>
                  <motion.span
                    key={centresCount}
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="block text-xl md:text-2xl font-bold font-serif-mct text-[#EA5B2D]"
                  >
                    {new Intl.NumberFormat('fr-FR').format(centresCount * 12000)} € / an
                  </motion.span>
                </div>
                
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-1">
                  <span className="block text-[8px] font-extrabold uppercase tracking-widest text-[#5A5A7A]">TEMPS CONVERSATIONNEL GAGNÉ</span>
                  <motion.span
                    key={centresCount}
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="block text-xl md:text-2xl font-bold font-serif-mct text-[#2D2A56]"
                  >
                    {centresCount * 10} heures / sem
                  </motion.span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. 6 avantages concrets Section: Premium custom border glow cards */}
          <section className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block">
                AVANTAGES
              </span>
              <h2 className="text-2xl md:text-3xl font-bold font-serif-mct text-[#2D2A56]">
                6 avantages concrets
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-semibold">
                Ce que la plateforme Léo change au quotidien.
              </p>
            </div>

            {/* Grid of benefits */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {advantages.map((adv, idx) => {
                const AdvIcon = adv.icon;

                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -5, scale: 1.015 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`group relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-100/60 transition-all duration-300 ${adv.glow}`}
                  >
                    {/* Shiny sweep overlay */}
                    <div className="absolute inset-0 w-[150%] h-full bg-gradient-to-r from-transparent via-slate-100/30 to-transparent -skew-x-20 -translate-x-full group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out pointer-events-none" />

                    <div>
                      <div className="h-9 w-9 rounded-xl bg-orange-50 text-[#EA5B2D] flex items-center justify-center mb-4 border border-[#EA5B2D]/10 group-hover:scale-110 transition-transform duration-300">
                        <AdvIcon className="h-4.5 w-4.5" />
                      </div>
                      <h4 className="text-xs md:text-sm font-extrabold text-[#2D2A56] uppercase tracking-wide mb-2 leading-snug">
                        {adv.title}
                      </h4>
                      <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed font-semibold">
                        {adv.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* 5. Live Simulation / WhatsApp Sandbox Test */}
          <section className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] text-center space-y-6">
            <div className="space-y-2">
              <span className="text-[#EA5B2D] text-[10px] font-extrabold tracking-widest uppercase block">
                TESTER LA DÉMO EN DIRECT
              </span>
              <h3 className="text-xl md:text-2xl font-bold font-serif-mct text-[#2D2A56] tracking-tight">
                Un message, une démo instantanée
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold max-w-md mx-auto">
                Envoyez un message WhatsApp à notre numéro de test pour simuler instantanément le flux d'un nouveau gérant de centre.
              </p>
            </div>

            {/* Simulated telephone number widget */}
            <div className="inline-flex items-center gap-3 bg-slate-50 border border-slate-200/50 py-3.5 px-6 rounded-2xl shadow-inner select-all relative overflow-hidden group">
              <Smartphone className="h-5 w-5 text-[#EA5B2D]" />
              <span className="text-lg md:text-xl font-extrabold font-serif-mct text-[#2D2A56] tracking-wider">+33 7 59 95 95 21</span>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#EA5B2D] hover:bg-[#d84e20] text-white transition-colors cursor-pointer shadow-md shadow-[#EA5B2D]/20 active:scale-95"
              >
                Lancer une simulation
              </button>
              <button
                type="button"
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-white border border-[#2D2A56] text-[#2D2A56] hover:bg-slate-50 transition-colors cursor-pointer active:scale-95"
              >
                Contacter un conseiller
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
