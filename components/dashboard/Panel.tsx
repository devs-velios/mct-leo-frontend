"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard dashboard panel shell — consistent card, header (eyebrow + title +
 * optional subtitle) and an actions slot. Keeps every dashboard block identical
 * in spacing, radius, border and shadow.
 */
export function Panel({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
  bodyClassName,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex h-full flex-col rounded-3xl border border-slate-100/70 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]",
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#E34F2D]">
              {eyebrow}
            </span>
          )}
          <h4 className="font-serif-mct text-base font-bold text-[#332151]">{title}</h4>
          {subtitle && <p className="mt-0.5 text-[10px] text-[#5A5A7A]">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Explicit empty state used whenever a block has no data to show. */
export function EmptyState({
  icon: Icon,
  message,
  hint,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  message: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[140px] flex-col items-center justify-center gap-2 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm font-semibold text-[#5A5A7A]">{message}</p>
      {hint && <p className="max-w-[220px] text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
