"use client";

/**
 * DateRangePicker — brand-adapted "Calendar (presets)" control for filtering the
 * dashboard charts by date. Mirrors the 21st.dev shugar/calendar UX (a presets
 * menu + a range calendar + Start/End + an Apply button) but is self-contained
 * and uses the app's own primitives (Popover, Button, the brand Calendar) and
 * palette — no Geist design tokens, no timezone/time-of-day inputs.
 *
 * Presets apply immediately; a manual calendar selection is committed with Apply.
 */

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check } from "lucide-react";
import { format, startOfDay, endOfDay, subDays, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import type { DateRange as RdpRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePreset {
  key: string;
  label: string;
  /** Builds the range when picked (called at click time so "now" is fresh). */
  build: () => DateRange;
}

/** Sensible default presets (FR), newest-first. */
export function defaultPresets(): DateRangePreset[] {
  const now = () => new Date();
  return [
    { key: "7d", label: "7 derniers jours", build: () => ({ start: startOfDay(subDays(now(), 6)), end: endOfDay(now()) }) },
    { key: "14d", label: "14 derniers jours", build: () => ({ start: startOfDay(subDays(now(), 13)), end: endOfDay(now()) }) },
    { key: "30d", label: "30 derniers jours", build: () => ({ start: startOfDay(subDays(now(), 29)), end: endOfDay(now()) }) },
    { key: "90d", label: "90 derniers jours", build: () => ({ start: startOfDay(subDays(now(), 89)), end: endOfDay(now()) }) },
    { key: "12m", label: "12 derniers mois", build: () => ({ start: startOfDay(subMonths(now(), 12)), end: endOfDay(now()) }) },
  ];
}

const fmt = (d: Date | null) => (d ? format(d, "d MMM yyyy", { locale: fr }) : "—");

interface DateRangePickerProps {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  presets?: DateRangePreset[];
  align?: "start" | "center" | "end";
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  presets = defaultPresets(),
  align = "end",
  className,
  placeholder = "Sélectionner une période",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  // In-popover draft for manual calendar selection (committed via Apply).
  const [draft, setDraft] = useState<RdpRange | undefined>(
    value?.start ? { from: value.start, to: value.end ?? undefined } : undefined,
  );

  // Keep the draft in sync when the popover (re)opens or the external value changes.
  useEffect(() => {
    if (open) setDraft(value?.start ? { from: value.start, to: value.end ?? undefined } : undefined);
  }, [open, value]);

  const activePresetKey = useMemo(() => {
    if (!value?.start || !value?.end) return null;
    const s = startOfDay(value.start).getTime();
    const e = endOfDay(value.end).getTime();
    return presets.find((p) => {
      const r = p.build();
      return r.start && r.end && startOfDay(r.start).getTime() === s && endOfDay(r.end).getTime() === e;
    })?.key ?? null;
  }, [value, presets]);

  const pickPreset = (p: DateRangePreset) => {
    onChange(p.build());
    setOpen(false);
  };

  const applyDraft = () => {
    if (draft?.from) {
      onChange({ start: startOfDay(draft.from), end: endOfDay(draft.to ?? draft.from) });
      setOpen(false);
    }
  };

  const label = value?.start && value?.end ? `${fmt(value.start)} – ${fmt(value.end)}` : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none transition-all",
            value?.start
              ? "border-[#E34F2D]/40 bg-[#E34F2D]/[0.04] text-[#332151] ring-2 ring-[#E34F2D]/15"
              : "border-slate-200/60 text-slate-700 hover:bg-white",
            className,
          )}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Presets menu */}
          <ul className="flex shrink-0 flex-col gap-0.5 border-b border-slate-100 p-2 sm:border-b-0 sm:border-r sm:w-44">
            <li className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Période</li>
            {presets.map((p) => {
              const active = activePresetKey === p.key;
              return (
                <li key={p.key}>
                  <button
                    type="button"
                    onClick={() => pickPreset(p)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors",
                      active ? "bg-[#E34F2D]/10 text-[#E34F2D]" : "text-[#332151] hover:bg-slate-50",
                    )}
                  >
                    {p.label}
                    {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Calendar + Start/End + Apply */}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={draft}
              onSelect={setDraft}
              numberOfMonths={1}
              locale={fr}
              defaultMonth={value?.start ?? new Date()}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-2.5 py-1.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Début</span>
                <span className="text-xs font-semibold text-[#332151]">{fmt(draft?.from ?? null)}</span>
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-2.5 py-1.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Fin</span>
                <span className="text-xs font-semibold text-[#332151]">{fmt(draft?.to ?? null)}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); }}
                className="text-[11px] font-bold text-[#5A5A7A] transition-colors hover:text-[#E34F2D]"
              >
                Réinitialiser
              </button>
              <Button size="sm" onClick={applyDraft} disabled={!draft?.from} className="text-xs font-bold">
                Appliquer
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
