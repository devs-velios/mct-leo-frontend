"use client";

import { type ReactNode } from "react";

/**
 * Lightweight CSS hover tooltip. Wrap an icon button to show its French action label
 * on hover. Uses a scoped `group/tip` so nested tooltips don't interfere.
 */
const SIDE_POS: Record<string, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
};

export default function Tooltip({
  label,
  children,
  side = "top",
  className,
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  /** Applied to the wrapper span — e.g. "w-full" so the trigger fills its cell. */
  className?: string;
}) {
  return (
    <span className={`group/tip relative inline-flex ${className ?? ""}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute ${SIDE_POS[side]} z-50 whitespace-nowrap rounded-lg bg-[#332151] px-2.5 py-1.5 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100`}
      >
        {label}
      </span>
    </span>
  );
}
