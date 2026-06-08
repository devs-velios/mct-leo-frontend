"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, FileX2 } from "lucide-react";

export interface PreviewTarget {
  driveLink?: string | null;
  docType: string;
  code: string;
}

/**
 * In-app document preview. Embeds the Google Drive file via its /preview variant (works
 * without a popup blocker, unlike window.open). Falls back to a clear message + an
 * "open in Drive" link when there's no file or it can't be embedded.
 */
export default function PreviewModal({ item, onClose }: { item: PreviewTarget | null; onClose: () => void }) {
  const view = item?.driveLink ?? null;
  // Drive share links come as .../file/d/<id>/view → /preview is the embeddable variant.
  const embed = view ? view.replace(/\/view.*$/, "/preview") : null;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.96, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 15, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative flex h-[82vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 shrink-0">
              <div className="min-w-0">
                <span className="block text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Aperçu du document</span>
                <h3 className="truncate text-sm font-extrabold text-[#2D2A56]">{item.docType} — {item.code}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {view && (
                  <a
                    href={view}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[10.5px] font-bold text-[#2D2A56] hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Ouvrir dans Drive <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-[#5A5A7A] hover:bg-slate-100 hover:text-[#2D2A56] transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 bg-slate-50">
              {embed ? (
                <iframe
                  src={embed}
                  title={`${item.docType} — ${item.code}`}
                  className="h-full w-full border-0"
                  allow="autoplay"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-6">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <FileX2 className="h-7 w-7" />
                  </span>
                  <p className="text-sm font-bold text-[#2D2A56]">Aucun fichier à prévisualiser</p>
                  <p className="max-w-sm text-xs font-semibold text-slate-400">
                    Ce document n&apos;a pas encore de fichier Drive associé.
                  </p>
                </div>
              )}
            </div>

            {/* Footer note: when the embed shows "access needed", the Drive file isn't shared. */}
            {embed && (
              <div className="border-t border-slate-100 px-5 py-2.5 text-[10px] font-semibold text-slate-400 shrink-0">
                Si l&apos;aperçu reste vide, le fichier Drive n&apos;est pas partagé en lecture — ouvrez-le dans Drive.
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
