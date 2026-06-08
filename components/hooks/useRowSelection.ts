"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Reusable selection state for any data table.
 *
 * Pass the *currently visible* ids (e.g. the current page, or the full filtered
 * set — your call) so "select all" / indeterminate reflect that scope.
 *
 *   const sel = useRowSelection(displayedDossiers.map(d => d.id));
 *   sel.toggle(id); sel.toggleAll(); sel.isSelected(id); sel.selectedIds; sel.clear();
 */
export function useRowSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const set = useCallback((id: string, value: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      value ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const visibleSet = useMemo(() => new Set(visibleIds), [visibleIds]);

  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected =
    !allSelected && visibleIds.some((id) => selected.has(id));

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      const everyVisibleSelected =
        visibleIds.length > 0 && visibleIds.every((id) => next.has(id));
      if (everyVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [visibleIds]);

  // Drop ids that are no longer visible/valid (keeps count honest after data refresh).
  const selectedIds = useMemo(
    () => [...selected].filter((id) => visibleSet.has(id)),
    [selected, visibleSet],
  );

  return {
    selectedIds,
    count: selectedIds.length,
    isSelected: (id: string) => selected.has(id),
    toggle,
    set,
    toggleAll,
    clear,
    allSelected,
    someSelected,
  };
}

export type RowSelection = ReturnType<typeof useRowSelection>;
