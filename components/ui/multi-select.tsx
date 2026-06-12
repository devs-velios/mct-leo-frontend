"use client";

/**
 * MultiSelect — multi-select combobox with search, built on the 21st.dev
 * "select-with-search" pattern (Popover + cmdk Command). Toggling an option
 * keeps the panel open; the trigger shows the active count. Brand-styled to
 * match the app's filter controls.
 */

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  /** Text shown on the trigger when nothing is selected. */
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  /** Extra classes for the dropdown panel (e.g. a width). Defaults to "w-56". */
  contentClassName?: string;
  /** Extra classes for the scrollable option list (e.g. "max-h-[200px]" to cap visible rows). */
  listClassName?: string;
  align?: "start" | "center" | "end";
  /** Show a "Tout effacer" action when there is an active selection. */
  clearable?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Sélectionner…",
  searchPlaceholder = "Rechercher…",
  emptyText = "Aucun résultat.",
  className,
  contentClassName,
  listClassName,
  align = "start",
  clearable = true,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const count = selected.length;
  const summary =
    count === 0
      ? placeholder
      : count === 1
        ? options.find((o) => o.value === selected[0])?.label ?? `${count} sélectionné`
        : `${count} sélectionnés`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex items-center justify-between gap-2 rounded-xl border bg-slate-50 px-3.5 py-2.5 text-xs font-semibold outline-none transition-all",
            count > 0
              ? "border-[#E34F2D]/40 bg-[#E34F2D]/[0.04] text-[#332151] ring-2 ring-[#E34F2D]/15"
              : "border-slate-200/60 text-slate-700 hover:bg-white",
            className,
          )}
        >
          <span className={cn("truncate", count === 0 && "text-slate-400")}>{summary}</span>
          {count > 0 ? (
            <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[#E34F2D] px-1 text-[10px] font-bold text-white">
              {count}
            </span>
          ) : (
            <ChevronDown size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className={cn("z-[120] p-0", contentClassName ?? "w-56")}>
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className={listClassName}>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                    className="cursor-pointer gap-2"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                        isSelected ? "border-[#E34F2D] bg-[#E34F2D] text-white" : "border-slate-300",
                      )}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          {clearable && count > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 px-3 py-2 text-[11px] font-bold text-[#5A5A7A] transition-colors hover:bg-slate-50 hover:text-[#E34F2D]"
            >
              <X size={12} /> Tout effacer
            </button>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
