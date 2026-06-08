

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { type ValidationItem, REJECT_REASONS } from "./validationsData";

interface RejectModalProps {
  item: ValidationItem | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function RejectModal({ item, onClose, onConfirm }: RejectModalProps) {
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Reset the reason to the default each time a new item is opened
  useEffect(() => {
    if (item) setRejectReason(REJECT_REASONS[0]);
  }, [item]);

  // Close the custom dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".reject-dropdown-container")) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isDropdownOpen]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key="reject-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 text-[#1A1A1A] shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold font-serif-mct text-[#332151]">
                Rejeter la pièce
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold mb-2">
                  Vous rejetez la pièce pour le centre <span className="font-extrabold text-[#332151]">{item.code}</span> ({item.nom}).
                </p>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A] mb-1.5">
                  Motif de rejet
                </label>

                {/* Custom Styled SaaS Rejection Reason Dropdown */}
                <div className="relative reject-dropdown-container">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-3 text-xs font-bold text-slate-800 outline-none flex items-center justify-between cursor-pointer hover:bg-slate-100/50 hover:border-slate-300 transition-all shadow-sm"
                  >
                    <span>{rejectReason}</span>
                    <ChevronDown className={`h-4.5 w-4.5 text-[#332151] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        key="reject-modal-reasons-dropdown"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1"
                      >
                        {REJECT_REASONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setRejectReason(option);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                              rejectReason === option
                                ? "bg-[#332151] text-white"
                                : "text-slate-700 hover:bg-slate-50 hover:text-[#E34F2D]"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={() => onConfirm(rejectReason)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                >
                  Confirmer le rejet
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
