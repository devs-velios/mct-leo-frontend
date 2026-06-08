"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  /** Tri-state: shows a dash. Used by "select all" headers on partial selection. */
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
}

/**
 * Brand-styled checkbox (accessible button + role=checkbox). Orange when active,
 * indigo focus ring. Used by table row selection and anywhere a checkbox is needed.
 */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked = false, indeterminate = false, onCheckedChange, label, className, onClick, ...props }, ref) => {
    const active = checked || indeterminate;
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? "mixed" : checked}
        aria-label={label}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) onCheckedChange?.(!checked);
        }}
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#332151]/40 focus-visible:ring-offset-1",
          active
            ? "border-[#E34F2D] bg-[#E34F2D] text-white"
            : "border-slate-300 bg-white hover:border-[#E34F2D]/60",
          className,
        )}
        {...props}
      >
        {indeterminate ? (
          <Minus className="h-3 w-3" strokeWidth={3} />
        ) : checked ? (
          <Check className="h-3 w-3" strokeWidth={3} />
        ) : null}
      </button>
    );
  },
);
Checkbox.displayName = "Checkbox";
