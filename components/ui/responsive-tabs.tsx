"use client";

/**
 * ResponsiveTabs — a segmented filter control that renders as the standard Tabs on
 * ≥sm screens and collapses to a dropdown on small screens, so filter rows never
 * wrap/overflow on mobile. Options carry an optional count badge (desktop) and icon.
 */

import { type LucideIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Select from "@/components/ui/Select";
import { cn } from "@/lib/utils";

export interface ResponsiveTabOption {
  value: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

export function ResponsiveTabs({
  value,
  onValueChange,
  options,
  className,
  listClassName,
  selectClassName,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: ResponsiveTabOption[];
  className?: string;
  listClassName?: string;
  selectClassName?: string;
}) {
  return (
    <div className={className}>
      {/* Mobile: dropdown */}
      <Select
        className={cn("w-full sm:hidden", selectClassName)}
        value={value}
        onChange={onValueChange}
        options={options.map((o) => ({
          value: o.value,
          label: o.count != null ? `${o.label} · ${o.count}` : o.label,
        }))}
      />

      {/* ≥sm: segmented tabs */}
      <Tabs value={value} onValueChange={onValueChange} className="hidden sm:block">
        <TabsList className={cn("flex-wrap", listClassName)}>
          {options.map((o) => {
            const Icon = o.icon;
            return (
              <TabsTrigger key={o.value} value={o.value}>
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {o.label}
                {o.count != null && (
                  <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[9px] font-black text-[#332151]">{o.count}</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
