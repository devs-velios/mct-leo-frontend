"use client";

/**
 * Shared "Centre" + "Ville" cell renderers so every table presents a centre the
 * same way (client spec): garage name first, garage code right below, and the
 * city in its OWN column (never inline with the code).
 */

import { MapPin } from "lucide-react";

interface CentreCellProps {
  /** Garage name (enseigne) — top line, bold. */
  name?: string | null;
  /** Garage code (code_centre) — second line, monospace. */
  code?: string | null;
}

/** Centre column: enseigne on top, code_centre below. City lives in VilleCell. */
export function CentreCell({ name, code }: CentreCellProps) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-[#332151] group-hover:text-[#E34F2D] transition-colors">
        {name || "—"}
      </p>
      {code && <p className="mt-0.5 font-mono text-[11px] text-slate-500">{code}</p>}
    </div>
  );
}

/** Ville column: city with a map pin, consistent across all tables. */
export function VilleCell({ ville }: { ville?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#5A5A7A]">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      {ville || "Non disponible"}
    </span>
  );
}
