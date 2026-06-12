"use client";

/**
 * CityFilter — the shared "Ville" filter button (popover) used on every table.
 * It is a MultiSelect whose option list is capped to ~5 visible cities and then
 * scrolls, so a long city list never floods the screen (client spec). Options
 * are derived (deduped + sorted) from whatever cities the current dataset has.
 */

import { useMemo } from "react";
import { MultiSelect } from "@/components/ui/multi-select";

interface CityFilterProps {
  /** Raw city values from the current rows (may contain blanks/duplicates). */
  cities: (string | null | undefined)[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export function CityFilter({ cities, selected, onChange }: CityFilterProps) {
  const options = useMemo(() => {
    const unique = [...new Set(cities.filter((c): c is string => Boolean(c && c.trim())))];
    unique.sort((a, b) => a.localeCompare(b, "fr"));
    return unique.map((c) => ({ value: c, label: c }));
  }, [cities]);

  return (
    <MultiSelect
      options={options}
      selected={selected}
      onChange={onChange}
      placeholder="Ville"
      searchPlaceholder="Rechercher une ville…"
      emptyText="Aucune ville."
      align="end"
      // ~5 rows tall, then scroll — never a long flat list filling the screen.
      listClassName="max-h-[200px]"
    />
  );
}
