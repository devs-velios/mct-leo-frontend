"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Check, Sparkles } from "lucide-react";
import { type DashboardDossier } from "./dashboardData";

interface NewDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (dossier: DashboardDossier) => void;
}

export default function NewDossierModal({ isOpen, onClose, onCreate }: NewDossierModalProps) {
  const [newEnseigne, setNewEnseigne] = useState("Norauto");
  const [newVille, setNewVille] = useState("Lyon");
  const [newGerant, setNewGerant] = useState("Jean Dupont");
  const [newContact, setNewContact] = useState("33612345678");
  const [isEnseigneDropdownOpen, setIsEnseigneDropdownOpen] = useState(false);

  // Close Enseigne dropdown on outside click
  useEffect(() => {
    if (!isEnseigneDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".enseigne-dropdown-container")) {
        setIsEnseigneDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isEnseigneDropdownOpen]);

  const handleCreateDossier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnseigne || !newVille || !newGerant) return;

    const newId = `OD${Math.floor(100 + Math.random() * 900)}`;
    const formattedEnseigne = newEnseigne === "Indépendant"
      ? `Mon Contrôle Technique ${newVille}`
      : `Mon Contrôle Technique ${newEnseigne} ${newVille}`;

    onCreate({
      id: newId,
      enseigne: formattedEnseigne,
      ville: newVille,
      gerant: newGerant,
      phase: "Onboarding",
      joursInactif: 0,
      statut: "normal",
      contact: newContact ? (newContact.startsWith("+") ? newContact : `+${newContact}`) : "+33 6 00 00 00 00"
    });

    // Reset form to defaults
    setNewEnseigne("Norauto");
    setNewVille("Lyon");
    setNewGerant("Jean Dupont");
    setNewContact("33612345678");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="relative w-full max-w-md rounded-2xl bg-white text-[#1A1A1A] shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Header block */}
            <div className="p-6 pb-4 relative flex flex-col">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-xl font-extrabold text-[#1A1A1A] pr-8">
                Simuler un nouveau dossier
              </h3>

              <p className="text-xs text-slate-505 text-slate-500 mt-2 font-semibold leading-relaxed">
                Crée un dossier de démonstration et génère un groupe WhatsApp pour l'onboarding du gérant.
              </p>
            </div>

            {/* Form block */}
            <form onSubmit={handleCreateDossier} className="flex-1 flex flex-col min-h-0">
              <div className="px-6 pb-6 space-y-4.5 overflow-y-auto">

                {/* Enseigne custom premium dropdown */}
                <div className="relative enseigne-dropdown-container">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    Enseigne
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsEnseigneDropdownOpen(!isEnseigneDropdownOpen)}
                    className="w-full rounded-xl bg-white border border-slate-200/80 px-4 py-3 text-xs font-semibold text-slate-800 outline-none flex items-center justify-between cursor-pointer hover:bg-slate-50/50 hover:border-slate-300 transition-all shadow-sm"
                  >
                    <span>{newEnseigne}</span>
                    <ChevronDown className={`h-4.5 w-4.5 text-slate-500 transition-transform duration-200 ${isEnseigneDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isEnseigneDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1"
                      >
                        {["Norauto", "Speedy", "Feu Vert", "Indépendant"].map((option) => {
                          const isSelected = newEnseigne === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setNewEnseigne(option);
                                setIsEnseigneDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-between hover:bg-slate-50 ${isSelected ? "text-slate-800" : "text-slate-600"
                                }`}
                            >
                              <span>{option}</span>
                              {isSelected && <Check className="h-4 w-4 text-[#1A1A1A] shrink-0" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Ville field */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    Ville
                  </label>
                  <input
                    type="text"
                    required
                    value={newVille}
                    onChange={(e) => setNewVille(e.target.value)}
                    placeholder="ex: Lyon"
                    className="w-full rounded-xl border border-slate-200/80 px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-slate-300 transition-all bg-white shadow-sm"
                  />
                </div>

                {/* Nom du gérant field */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    Nom du gérant
                  </label>
                  <input
                    type="text"
                    required
                    value={newGerant}
                    onChange={(e) => setNewGerant(e.target.value)}
                    placeholder="ex: Jean Dupont"
                    className="w-full rounded-xl border border-slate-200/80 px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-slate-300 transition-all bg-white shadow-sm"
                  />
                </div>

                {/* Numéro WhatsApp field */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider text-[10px]">
                    Numéro WhatsApp du gérant
                  </label>
                  <input
                    type="text"
                    required
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="ex: 33612345678"
                    className="w-full rounded-xl border border-slate-200/80 px-4 py-3 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-slate-300 transition-all bg-white shadow-sm"
                  />
                  <p className="text-[10.5px] text-slate-400 font-semibold mt-2.5 leading-relaxed">
                    Numéro doit être un contact WhatsApp actif pour permettre l'ajout au groupe (sinon fallback mock).
                  </p>
                </div>
              </div>

              {/* Footer block */}
              <div className="bg-slate-50/70 p-5 border-t border-slate-100 flex items-center justify-end shrink-0">
                <button
                  type="submit"
                  className="px-5 py-3 text-xs font-bold rounded-xl bg-[#EA5B2D] hover:bg-[#d84e20] hover:scale-[1.01] active:scale-95 text-white transition-all cursor-pointer shadow-md shadow-[#EA5B2D]/10 inline-flex items-center gap-2 select-none"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-white" />
                  <span>Créer le dossier</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
