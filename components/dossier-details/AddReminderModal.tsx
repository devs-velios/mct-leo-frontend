"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { BellPlus, X, Loader2 } from "lucide-react";
import { useRemindersContext } from "@/lib/features/reminders";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { SingleSelect } from "@/components/ui/single-select";

/**
 * Schedule a reminder for a dossier — date/heure (shared DateTimePicker), an optional
 * pièce (the centre's expected documents), and an optional message. Empty pièce = digest.
 */
export default function AddReminderModal({
  open,
  dossierId,
  centreLabel,
  pieceOptions,
  onClose,
}: {
  open: boolean;
  dossierId: string | null;
  centreLabel: string;
  pieceOptions: { value: string; label: string }[];
  onClose: () => void;
}) {
  const { create } = useRemindersContext();
  const [when, setWhen] = useState<Date | undefined>(undefined);
  const [piece, setPiece] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Reset the form whenever the modal (re)opens.
  useEffect(() => {
    if (open) { setWhen(undefined); setPiece(""); setMessage(""); setBusy(false); }
  }, [open]);

  const pieceChoices = [{ value: "", label: "Tous les documents (récapitulatif)" }, ...pieceOptions];

  const submit = async () => {
    if (!dossierId || !when) return;
    try {
      setBusy(true);
      await create({
        dossier_id: dossierId,
        scheduled_at: when.toISOString(),
        piece: piece.trim() || null,
        message: message.trim() || null,
      });
      toast.success("Rappel programmé.");
      onClose();
    } catch {
      toast.error("Échec de la programmation du rappel.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.96, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100"
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E34F2D]/10 text-[#E34F2D]">
                  <BellPlus className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-serif-mct text-xl font-extrabold leading-tight text-[#332151]">Ajouter un rappel</h3>
                  <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{centreLabel}</p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Fermer" className="shrink-0 rounded-xl p-1.5 text-[#5A5A7A] transition hover:bg-slate-100 hover:text-[#332151] cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Date & heure — shared picker */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Date et heure</label>
                <DateTimePicker value={when} onChange={setWhen} fromDate={new Date()} placeholder="Choisir date et heure" />
              </div>

              {/* Pièce — the centre's expected documents */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Document concerné</label>
                <SingleSelect value={piece} options={pieceChoices} onChange={setPiece} placeholder="Choisir un document" searchPlaceholder="Rechercher un document…" className="w-full" fullWidth />
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Message (optionnel)</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Relancer le client pour…"
                  className="w-full resize-y rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#E34F2D] focus:bg-white"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#5A5A7A] transition hover:bg-slate-100 cursor-pointer">
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={!when || busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#332151] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#E34F2D] disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellPlus className="h-3.5 w-3.5" />} Programmer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
