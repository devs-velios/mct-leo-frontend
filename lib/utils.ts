import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Fallback for empty/missing values so the UI never shows a blank field.
 * Returns the value when present, otherwise "Non disponible".
 */
export function na(value?: string | number | null): string {
  if (value === null || value === undefined) return "Non disponible";
  const s = String(value).trim();
  return s ? s : "Non disponible";
}
