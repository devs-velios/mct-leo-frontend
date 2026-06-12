"use client";

// Error boundary for the whole /dashboard segment. Without this, any uncaught
// render error (or a stale-deploy chunk-load failure) falls through to Next's
// bare "This page couldn't load" page. Here we recover gracefully instead:
//   • chunk-load errors (old tab after a redeploy) → reload once automatically;
//   • everything else → a branded card with Réessayer (reset) / Recharger, and
//     the actual message so the failure is debuggable.

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";

const isChunkError = (e: Error) =>
  e.name === "ChunkLoadError" ||
  /Loading chunk|Failed to fetch dynamically imported module|importing a module script failed/i.test(e.message);

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // A stale deployment serves chunk filenames the open tab no longer has; a single
    // hard reload pulls the current build. Guard against a reload loop with a flag.
    if (isChunkError(error) && typeof window !== "undefined") {
      const KEY = "mct_chunk_reload";
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, "1");
        window.location.reload();
      }
    } else if (typeof window !== "undefined") {
      sessionStorage.removeItem("mct_chunk_reload");
    }
  }, [error]);

  return (
    <div className="flex h-full min-h-[60vh] flex-1 flex-col items-center justify-center gap-5 bg-[#F5F5F7] px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E34F2D]/10 text-[#E34F2D]">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <div className="max-w-sm space-y-1.5">
        <h2 className="font-serif-mct text-xl font-bold text-[#332151]">Cette page n&apos;a pas pu s&apos;afficher</h2>
        <p className="text-xs leading-relaxed text-[#5A5A7A]">
          Une erreur est survenue lors du chargement. Réessayez, ou rechargez la page si le problème persiste.
        </p>
        {error?.message && (
          <p className="mt-2 break-words rounded-lg bg-white px-3 py-2 font-mono text-[11px] text-rose-600 ring-1 ring-rose-100">
            {error.message}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#E34F2D] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#DF3714]"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Réessayer
        </button>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#332151] transition-colors hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Recharger
        </button>
      </div>
    </div>
  );
}
