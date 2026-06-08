"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FolderInput } from "lucide-react";
import Select, { type SelectOption } from "@/components/ui/Select";

interface MoveModalProps {
  item: { code: string; docType: string } | null;
  options: SelectOption[];
  onClose: () => void;
  onConfirm: (folder: string) => void;
}

/** Reclassify a piece into another Drive folder — uses our on-brand Select dropdown. */
export default function MoveModal({ item, options, onClose, onConfirm }: MoveModalProps) {
  const [folder, setFolder] = useState(options[0]?.value ?? "");

  // Reset to the first option each time a new piece is opened.
  useEffect(() => {
    if (item) setFolder(options[0]?.value ?? "");
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 text-[#1A1A1A] shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
              <h3 className="flex items-center gap-2 text-lg font-bold font-serif-mct text-[#332151]">
                <FolderInput className="h-5 w-5 text-[#E34F2D]" />
                Déplacer la pièce
              </h3>
              <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-semibold">
                Choisissez le dossier de destination pour <span className="font-extrabold text-[#332151]">{item.docType}</span> ({item.code}).
              </p>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A] mb-1.5">
                  Dossier de destination
                </label>
                <Select value={folder} options={options} onChange={setFolder} className="w-full" />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={() => folder && onConfirm(folder)}
                  disabled={!folder}
                  className="flex-1 py-2.5 text-xs font-bold rounded-lg bg-[#E34F2D] hover:bg-[#DF3714] text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  Déplacer
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
