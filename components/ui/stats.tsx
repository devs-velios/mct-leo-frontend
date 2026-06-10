"use client";

import * as React from "react";
import { type LucideIcon } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

export interface StatItem {
  /** The metric value (number/string/node). */
  value: React.ReactNode;
  /** Hidden in the cell — shown as a hover tooltip instead. */
  label: string;
  icon?: LucideIcon;
  /** Orange-accented emphasis (e.g. open alerts > 0). */
  highlight?: boolean;
  /** Render the shimmer placeholder instead of the value. */
  loading?: boolean;
}

/**
 * KPI strip — evenly-sized separate cards with spacing between them. Each card
 * shows an icon + value only; the metric label is exposed through a tooltip
 * (on the right) on hover, keeping the cards clean and dense.
 */
export function Stats({
  items,
  className,
}: {
  items: StatItem[];
  className?: string;
}) {
  return (
    <div
      role="list"
      aria-label="Indicateurs clés"
      // auto-fit so the cards wrap to 2–3 per row on small screens instead of being
      // squeezed into one row, and fill out evenly on wide screens.
      className={cn("grid w-full gap-3 sm:gap-4 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]", className)}
    >
      {items.map((s, i) => {
        const Icon = s.icon;
        // Flip the last card's tooltip leftwards so it never spills past the page edge.
        const side = i === items.length - 1 ? "left" : "right";
        return (
          <Tooltip key={i} label={s.label} side={side} className="w-full">
            <div
              role="listitem"
              className={cn(
                "flex w-full cursor-default items-center justify-center gap-3.5 rounded-2xl border bg-white px-5 py-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-shadow duration-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)]",
                s.highlight ? "border-[#E34F2D]/30 bg-[#E34F2D]/[0.03]" : "border-slate-100",
              )}
            >
              {Icon && (
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    s.highlight ? "bg-[#E34F2D]/10 text-[#E34F2D]" : "bg-slate-100 text-[#332151]",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
              )}
              <span
                className={cn(
                  "text-[2rem] font-bold leading-none tabular-nums",
                  s.highlight ? "text-[#E34F2D]" : "text-[#332151]",
                )}
              >
                {s.loading ? (
                  <span className="inline-block h-7 w-10 animate-pulse rounded-md bg-slate-200/70 align-middle" />
                ) : (
                  s.value
                )}
              </span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
