// Alerts feature — public hook. Lazy cache-guarded list + resolve mutation.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { alertsReducer, initialAlertsState } from "./alertsReducer";
import { fetchAlerts, resolveAlert } from "./api";
import { type AlertStatusFilter } from "./types";
import { invalidate, CACHE } from "@/lib/features/cacheBus";

export function useAlerts() {
  const [state, dispatch] = useReducer(alertsReducer, initialAlertsState);
  const mountedRef = useRef(true);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;
  // Remember which filter the cache currently holds, so switching filters
  // (e.g. open ↔ resolved tab) refetches but revisiting the same one is cached.
  const loadedKeyRef = useRef<string | null>(null);
  // Remember the last params used, so a mutation can re-pull authoritative data.
  const lastParamsRef = useRef<{ status?: AlertStatusFilter; centre_id?: string } | undefined>(undefined);
  // Dedup concurrent first-callers (e.g. Navbar + AlertsBell mounting together).
  const inFlightRef = useRef<Map<string, Promise<void>>>(new Map());

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async (params?: { status?: AlertStatusFilter; centre_id?: string }) => {
    lastParamsRef.current = params;
    dispatch({ type: "FETCH_START" });
    try {
      const data = await fetchAlerts(params);
      if (mountedRef.current) dispatch({ type: "FETCH_SUCCESS", alerts: data.alerts, count: data.count });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "FETCH_ERROR", error: err instanceof Error ? err.message : "Échec du chargement des alertes" });
      }
    }
  }, []);

  // Re-pull the list from the backend using the last-used filter (cache reconciliation).
  const revalidate = useCallback(() => refresh(lastParamsRef.current), [refresh]);

  // Fetch once per filter; reuse cached state on later mounts. force=true bypasses the guard.
  const ensureLoaded = useCallback(async (
    params?: { status?: AlertStatusFilter; centre_id?: string },
    force = false,
  ) => {
    const key = JSON.stringify(params ?? {});
    if (!force) {
      if (loadedKeyRef.current === key && statusRef.current === "loaded") return;
      const pending = inFlightRef.current.get(key);
      if (pending) return pending;
    }
    loadedKeyRef.current = key;
    const p = refresh(params).finally(() => { inFlightRef.current.delete(key); });
    inFlightRef.current.set(key, p);
    return p;
  }, [refresh]);

  const resolve = useCallback(async (id: string) => {
    if (mountedRef.current) dispatch({ type: "RESOLVE_SUCCESS", id }); // optimistic
    try {
      const result = await resolveAlert(id);
      void revalidate(); // reconcile with backend truth
      // Resolving a blocage changes the centre's status + KPI counts elsewhere.
      invalidate(CACHE.dashboard, CACHE.heatmap, CACHE.centres, CACHE.dossiers);
      return result;
    } catch (err) {
      await revalidate(); // roll back to backend state on failure
      throw err;
    }
  }, [revalidate]);

  return {
    alerts: state.alerts,
    count: state.count,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    refresh,
    revalidate,
    ensureLoaded,
    resolve,
  };
}
