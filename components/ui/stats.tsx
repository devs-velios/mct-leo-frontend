"use client";

import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatItem {
  /** The metric value (number/string/node). */
  value: React.ReactNode;
  /** Label shown at the top of the card. */
  label: string;
  /** Optional one-line supporting text at the bottom. */
  subtext?: React.ReactNode;
  icon?: LucideIcon;
  /** Filled brand-orange card (the "hero" metric). */
  highlight?: boolean;
  /** Red-accented value/subtext (e.g. blocked dossiers > 0). */
  danger?: boolean;
  /** When set, the whole card is a button that navigates/acts on click. */
  onClick?: () => void;
  /** Render the shimmer placeholder instead of the value. */
  loading?: boolean;
}

/**
 * KPI strip — card layout: label top-left, icon top-right (in a circle), a large
 * figure, and a single-line subtext at the bottom. Labels/subtext are truncated
 * to one line so every card keeps the same shape. `highlight` renders a filled
 * brand card; `danger` tints the figure red. Actionable when `onClick` is set.
 */
export function Stats({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    <div
      role="list"
      aria-label="Indicateurs clés"
      className={cn("grid w-full items-stretch gap-3 sm:gap-4 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]", className)}
    >
      {items.map((s, i) => {
        const Icon = s.icon;
        const clickable = Boolean(s.onClick) && !s.loading;
        const valueColor = s.highlight ? "text-white" : s.danger ? "text-[#E11D48]" : "text-[#332151]";
        return (
          <div
            key={i}
            role="listitem"
            onClick={clickable ? s.onClick : undefined}
            onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); s.onClick?.(); } } : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-label={clickable ? s.label : undefined}
            className={cn(
              "flex h-full flex-col gap-3 rounded-2xl border p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-200",
              s.highlight
                ? "border-transparent bg-[#E34F2D] shadow-[0_12px_30px_-8px_rgba(227,79,45,0.45)]"
                : s.danger
                  ? "border-[#E11D48]/25 bg-white"
                  : "border-slate-100 bg-white",
              clickable && "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgb(0,0,0,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#332151]/30",
            )}
          >
            {/* Label + icon */}
            <div className="flex min-h-[2.25rem] items-start justify-between gap-2">
              <span className={cn("line-clamp-2 text-sm font-semibold leading-tight", s.highlight ? "text-white/90" : "text-[#332151]")}>
                {s.label}
              </span>
              {Icon && (
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    s.highlight ? "bg-white/20 text-white" : s.danger ? "bg-[#E11D48]/10 text-[#E11D48]" : "bg-slate-100 text-[#332151]",
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
              )}
            </div>

            {/* Figure */}
            <div className={cn("text-[2.1rem] font-bold leading-none tabular-nums", valueColor)}>
              {s.loading ? (
                <span className="inline-block h-7 w-12 animate-pulse rounded-md bg-slate-200/70 align-middle" />
              ) : (
                s.value
              )}
            </div>

            {/* Subtext (one line) */}
            {s.subtext && (
              <div
                className={cn(
                  "mt-auto truncate text-[11px] font-medium",
                  s.highlight ? "text-white/80" : s.danger ? "text-[#E11D48]" : "text-[#5A5A7A]",
                )}
                title={typeof s.subtext === "string" ? s.subtext : undefined}
              >
                {s.subtext}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
