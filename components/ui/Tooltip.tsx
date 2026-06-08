"use client";

import { type ReactNode } from "react";

/**
 * Lightweight CSS hover tooltip. Wrap an icon button to show its French action label
 * on hover. Uses a scoped `group/tip` so nested tooltips don't interfere.
 */
export default function Tooltip({
  label,
  children,
  side = "top",
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "bottom";
}) {
  const pos = side === "top" ? "bottom-full mb-2" : "top-full mt-2";
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute ${pos} left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#2D2A56] px-2.5 py-1.5 text-[10px] font-bold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100`}
      >
        {label}
      </span>
    </span>
  );
}
