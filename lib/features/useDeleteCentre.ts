"use client";

import { useCallback } from "react";
import { useCentresContext } from "./centres";
import { useDossiersContext } from "./dossiers";

/**
 * Delete a centre and refresh BOTH connected caches. A centre owns its dossier(s),
 * so removing it (via the centres delete route) must reconcile the centres list AND
 * the dossiers list everywhere the change is visible — call this from every delete
 * entry point (centre detail, centres bulk, dossiers bulk).
 */
export function useDeleteCentre() {
  const { remove } = useCentresContext();
  const { revalidate: revalidateDossiers } = useDossiersContext();

  return useCallback(
    async (id: string) => {
      const result = await remove(id); // optimistic centres removal + centres list revalidate
      void revalidateDossiers(); // its connected dossier(s) are gone too
      return result;
    },
    [remove, revalidateDossiers],
  );
}
