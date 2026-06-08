// Dossiers feature — public hook. Lazy cache-guarded pipeline list + advance-stage.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { dossiersReducer, initialDossiersState } from "./dossiersReducer";
import { fetchDossiers, fetchDossier, advanceDossierStage } from "./api";
import { type AdvancePayload, type DossierDetail } from "./types";

export function useDossiers() {
  const [state, dispatch] = useReducer(dossiersReducer, initialDossiersState);
  const mountedRef = useRef(true);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;
  const loadedKeyRef = useRef<string | null>(null);
  const lastParamsRef = useRef<{ stage?: string; centre_id?: string } | undefined>(undefined);
  // Dedup concurrent first-callers (components mounting in the same commit).
  const inFlightRef = useRef<Map<string, Promise<void>>>(new Map());
  // Single-dossier cache + dedup (used to resolve a dossier → its centre on the detail page).
  const dossierCacheRef = useRef<Map<string, DossierDetail>>(new Map());
  const dossierInFlightRef = useRef<Map<string, Promise<DossierDetail>>>(new Map());

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async (params?: { stage?: string; centre_id?: string }) => {
    lastParamsRef.current = params;
    dispatch({ type: "FETCH_START" });
    try {
      const data = await fetchDossiers(params);
      if (mountedRef.current) dispatch({ type: "FETCH_SUCCESS", dossiers: data.dossiers, count: data.count });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "FETCH_ERROR", error: err instanceof Error ? err.message : "Failed to load dossiers" });
      }
    }
  }, []);

  // Re-pull from backend with the last-used filter (cache reconciliation).
  const revalidate = useCallback(() => refresh(lastParamsRef.current), [refresh]);

  const ensureLoaded = useCallback(async (params?: { stage?: string; centre_id?: string }, force = false) => {
    const key = JSON.stringify(params ?? {});
    if (!force) {
      if (loadedKeyRef.current === key && statusRef.current === "loaded") return;
      const pending = inFlightRef.current.get(key);
      if (pending) return pending; // a concurrent caller already started this fetch
    }
    loadedKeyRef.current = key;
    const p = refresh(params).finally(() => { inFlightRef.current.delete(key); });
    inFlightRef.current.set(key, p);
    return p;
  }, [refresh]);

  // Cached single-dossier getter (cache-first, deduped). Resolves a dossier to its
  // centre on the detail page without refetching or double-firing.
  const getDossier = useCallback(async (id: string, force = false): Promise<DossierDetail> => {
    if (!force) {
      const cached = dossierCacheRef.current.get(id);
      if (cached) return cached;
      const pending = dossierInFlightRef.current.get(id);
      if (pending) return pending;
    }
    const p = fetchDossier(id)
      .then((d) => { dossierCacheRef.current.set(id, d); return d; })
      .finally(() => { dossierInFlightRef.current.delete(id); });
    dossierInFlightRef.current.set(id, p);
    return p;
  }, []);

  // Move a dossier one stage; backend recomputes macro status. Re-pull to reflect it.
  const advance = useCallback(async (dossierId: string, payload: AdvancePayload) => {
    const result = await advanceDossierStage(dossierId, payload);
    await revalidate();
    return result;
  }, [revalidate]);

  return {
    dossiers: state.list,
    count: state.count,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    refresh,
    revalidate,
    ensureLoaded,
    getDossier,
    advance,
  };
}
