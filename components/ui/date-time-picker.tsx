"use client";

import * as React from "react";
import { CalendarDays, Clock } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Disable days before this date (e.g. new Date() to forbid the past). */
  fromDate?: Date;
}

// 15-minute slots, 08:00 → 20:00.
const TIME_SLOTS = Array.from({ length: 49 }, (_, i) => {
  const total = i * 15 + 8 * 60;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

const fmt = (d: Date) =>
  `${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Choisir une date et une heure",
  disabled,
  className,
  fromDate,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedTime = value
    ? `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
    : null;
  // Disable days strictly before `fromDate`'s DAY (normalize to midnight so "today" stays selectable).
  const minDay = fromDate
    ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
    : undefined;

  const handleDay = (day?: Date) => {
    if (!day) return;
    const next = new Date(day);
    next.setHours(value ? value.getHours() : 9, value ? value.getMinutes() : 0, 0, 0);
    onChange(next);
  };

  const handleTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const next = value ? new Date(value) : new Date();
    next.setHours(h, m, 0, 0);
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm transition-colors hover:border-[#332151]/30 focus:outline-none focus:ring-2 focus:ring-[#332151]/10 disabled:opacity-50",
            className,
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
          <span className={cn("truncate", value ? "font-semibold text-[#332151]" : "font-medium text-slate-400")}>
            {value ? fmt(value) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto z-[120] max-h-[80vh] max-w-[calc(100vw-1.5rem)] overflow-y-auto">
        <div className="flex max-sm:flex-col">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDay}
            defaultMonth={value}
            disabled={minDay ? { before: minDay } : undefined}
            className="p-3"
          />
          <div className="flex flex-col border-slate-100 max-sm:border-t sm:border-l">
            <div className="flex items-center gap-1.5 px-3 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <Clock className="h-3 w-3" /> Heure
            </div>
            <div className="no-scrollbar grid w-full grid-cols-3 gap-1 overflow-y-auto p-3 max-h-[160px] sm:w-36 sm:grid-cols-1 sm:max-h-[268px]">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTime(t)}
                  className={cn(
                    "rounded-lg px-2 py-1.5 text-xs font-bold transition-colors",
                    selectedTime === t ? "bg-[#332151] text-white" : "text-[#332151] hover:bg-slate-100",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
