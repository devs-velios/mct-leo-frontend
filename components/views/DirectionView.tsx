"use client";

import { useEffect, useState } from "react";
import { Menu, Filter } from "lucide-react";
import {
  useHeatmapContext,
  HEATMAP_TONE,
  HEATMAP_DOT,
  HEATMAP_EMPTY_TONE,
  cellFor,
  fmtDays,
  rowCentreName,
} from "@/lib/features/heatmap";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";

const LEGEND: { color: "green" | "orange" | "red"; label: string }[] = [
  { color: "green", label: "Dans les temps" },
  { color: "orange", label: "À surveiller" },
  { color: "red", label: "Bloqué" },
];

interface DirectionViewProps {
  setMobileMenuOpen?: (open: boolean) => void;
  onOpenDossier?: (dossierId: string) => void;
}

export default function DirectionView({ setMobileMenuOpen, onOpenDossier }: DirectionViewProps) {
  const { phases, rows, thresholds, isLoading, ensureLoaded, setThresholds } = useHeatmapContext();

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);

  // Date range is shown for parity with the brief, but the heat map is a LIVE snapshot
  // (durations reconstructed from each dossier's history) — the API has no date filter.
  const [range, setRange] = useState<DateRange | null>(null);

  // Threshold filter (the real, API-backed filter): green < orange ≤ … < red.
  const [filterOpen, setFilterOpen] = useState(false);
  const [orange, setOrange] = useState(thresholds.orange_days);
  const [red, setRed] = useState(thresholds.red_days);
  useEffect(() => { setOrange(thresholds.orange_days); setRed(thresholds.red_days); }, [thresholds]);

  const applyThresholds = () => {
    setThresholds({ orange_days: Math.max(0, orange), red_days: Math.max(orange, red) });
    setFilterOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F5F7]">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 bg-white border-b border-slate-100 shrink-0 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center justify-between md:hidden mb-2">
            <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
            <button onClick={() => setMobileMenuOpen?.(true)} className="rounded-lg p-2 text-[#332151] hover:bg-slate-100" aria-label="Ouvrir le menu">
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold font-serif-mct text-[#332151] tracking-tight">Vue Direction</h2>
          <p className="text-xs text-[#5A5A7A] mt-0.5">Temps passé par étape</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 custom-scrollbar">
        <div className="max-w-[1500px] mx-auto w-full min-w-0 space-y-4">
          {/* Legend + filters (kept together on one row) */}
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2.5">
            {LEGEND.map((l) => (
              <span key={l.color} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#5A5A7A]">
                <span className={`h-3 w-3 rounded-full ${HEATMAP_DOT[l.color]}`} /> {l.label}
              </span>
            ))}
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            <DateRangePicker value={range} onChange={setRange} />
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold text-[#332151]">
                  <Filter className="h-3.5 w-3.5" /> Filtrer
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#5A5A7A]">Seuils (jours)</p>
                <div className="space-y-3">
                  <label className="flex items-center justify-between gap-3 text-xs font-semibold text-[#332151]">
                    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> À surveiller ≥</span>
                    <input type="number" min={0} value={orange} onChange={(e) => setOrange(Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-right text-xs font-semibold outline-none focus:border-[#332151]" />
                  </label>
                  <label className="flex items-center justify-between gap-3 text-xs font-semibold text-[#332151]">
                    <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Bloqué ≥</span>
                    <input type="number" min={0} value={red} onChange={(e) => setRed(Number(e.target.value))}
                      className="w-16 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-right text-xs font-semibold outline-none focus:border-[#332151]" />
                  </label>
                </div>
                <Button size="sm" onClick={applyThresholds} className="mt-4 w-full text-xs font-bold">Appliquer</Button>
              </PopoverContent>
            </Popover>
          </div>

          {/* Matrix — a FIXED "Case" column + a separately-scrollable pipeline panel,
              so scrolling the phases never disturbs the centre-name column. */}
          {isLoading && rows.length === 0 ? (
            <SkeletonTable rows={8} cols={7} />
          ) : rows.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-sm font-semibold text-[#5A5A7A] shadow-sm">
              Aucun dossier à afficher.
            </div>
          ) : (
            <div className="flex rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              {/* Fixed Case column */}
              <div className="shrink-0 w-[170px] border-r border-slate-100 sm:w-[230px]">
                <div className="flex h-[58px] items-center bg-slate-50/60 px-5 text-xs font-bold uppercase tracking-wider text-[#332151]">
                  Case
                </div>
                {rows.map((row) => (
                  <button
                    key={row.dossier_id}
                    type="button"
                    onClick={() => onOpenDossier?.(row.dossier_id)}
                    className="flex h-[68px] w-full items-center border-t border-slate-100 px-5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#332151]">{rowCentreName(row)}</p>
                      <p className="truncate font-mono text-[10px] text-slate-400">{row.centre.code_centre}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Scrollable pipeline panel (its own horizontal scrollbar) */}
              <div className="min-w-0 flex-1 overflow-x-auto custom-scrollbar">
                <div style={{ minWidth: `${phases.length * 150}px` }}>
                  {/* Header */}
                  <div className="grid h-[58px] bg-slate-50/60" style={{ gridTemplateColumns: `repeat(${phases.length}, minmax(150px,1fr))` }}>
                    {phases.map((p) => (
                      <div key={p.name} className="flex items-center justify-center border-l border-slate-100 px-3 text-center text-[11px] font-bold leading-tight text-[#5A5A7A]">
                        {p.label}
                      </div>
                    ))}
                  </div>
                  {/* Rows */}
                  {rows.map((row) => (
                    <div
                      key={row.dossier_id}
                      onClick={() => onOpenDossier?.(row.dossier_id)}
                      className="grid h-[68px] cursor-pointer border-t border-slate-100"
                      style={{ gridTemplateColumns: `repeat(${phases.length}, minmax(150px,1fr))` }}
                    >
                      {phases.map((p) => {
                        const cell = cellFor(row, p.name);
                        return (
                          <div key={p.name} className="border-l border-slate-100 p-1.5">
                            {cell ? (
                              <div
                                className={`flex h-full items-center justify-center rounded-lg text-sm font-bold tabular-nums ${HEATMAP_TONE[cell.color]} ${
                                  cell.current ? "ring-2 ring-[#332151]/40 shadow-sm" : ""
                                }`}
                                title={cell.current ? "Phase en cours" : undefined}
                              >
                                {fmtDays(cell.days)}
                              </div>
                            ) : (
                              <div className={`flex h-full items-center justify-center rounded-lg text-xs font-semibold ${HEATMAP_EMPTY_TONE}`}>—</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
