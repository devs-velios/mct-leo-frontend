"use client";

/**
 * TableToolbar — the single, shared "search + filters" bar that sits ABOVE every
 * data table (Centres, Dossiers, Validations, Rappels). Extracted verbatim from
 * the Centres page (the design reference) so all four tables are identical.
 *
 * Layout: a white rounded card with the search input on the left (own area) and
 * a right-aligned slot for filter controls (MultiSelect, city filter, view
 * toggles…) passed as `children`.
 */

import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Filter controls rendered on the right (MultiSelect, CityFilter, toggles…). */
  children?: ReactNode;
  className?: string;
}

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  children,
  className,
}: TableToolbarProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-3xl border border-slate-100/80 shadow-sm p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4",
        className,
      )}
    >
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl bg-slate-50 border border-slate-200/60 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:border-[#332151] focus:bg-white transition-all"
        />
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
