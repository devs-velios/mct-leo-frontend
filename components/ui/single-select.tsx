"use client";

/**
 * SingleSelect — single-value combobox built on the shared MultiSelect (the same
 * control used by the Centres status filter), so dropdowns look consistent app-wide.
 * Picking an option replaces the current value.
 */

import { MultiSelect, type MultiSelectOption } from "./multi-select";

export type SingleSelectOption = MultiSelectOption;

interface SingleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  align?: "start" | "center" | "end";
  /** Make the dropdown panel match the (full-width) trigger instead of the default w-56. */
  fullWidth?: boolean;
}

export function SingleSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  align,
  fullWidth,
}: SingleSelectProps) {
  return (
    <MultiSelect
      options={options}
      selected={value ? [value] : []}
      onChange={(vals) => onChange(vals.length ? vals[vals.length - 1] : "")}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyText={emptyText}
      className={className}
      // z above modal overlays (≥ z-100) so the panel isn't trapped behind a dialog.
      contentClassName={`${fullWidth ? "w-[var(--radix-popover-trigger-width)]" : "w-56"} z-[120]`}
      align={align}
      clearable={false}
    />
  );
}
