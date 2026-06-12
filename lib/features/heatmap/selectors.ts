// Direction heat-map feature — presentational helpers. Cell colour → tailwind tones,
// day formatting, and a safe cell lookup, so the view stays render-only.

import { type HeatmapColor, type HeatmapRow, type HeatmapCell } from "./types";

/** Saturated heat fill per cell colour (green = on-time, orange = watch, red = blocked). */
export const HEATMAP_TONE: Record<HeatmapColor, string> = {
  green: "bg-emerald-500 text-white",
  orange: "bg-amber-400 text-amber-950",
  red: "bg-rose-500 text-white",
};

/** Solid dot colour per cell colour (for legends). */
export const HEATMAP_DOT: Record<HeatmapColor, string> = {
  green: "bg-emerald-500",
  orange: "bg-amber-500",
  red: "bg-rose-500",
};

/** Empty cell (phase never entered by the dossier). */
export const HEATMAP_EMPTY_TONE = "bg-slate-50 text-slate-300";

/** Look up a dossier's cell for a phase column (undefined → phase never entered). */
export const cellFor = (row: HeatmapRow, phaseName: string): HeatmapCell | undefined => row.cells[phaseName];

/** Compact day label, e.g. 9.1 → "9 j". */
export const fmtDays = (d: number): string => `${Math.round(d)} j`;

/** Centre display name for a row (enseigne, falling back to the code). */
export const rowCentreName = (row: HeatmapRow): string => row.centre.enseigne ?? row.centre.code_centre;
