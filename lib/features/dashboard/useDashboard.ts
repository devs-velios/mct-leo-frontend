// Dashboard feature — the public hook. Auto-fetches stats on mount with optional
// polling. Can be used standalone or through the DashboardProvider context.

"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import { dashboardReducer, initialDashboardState } from "./dashboardReducer";
import { fetchDashboardStats } from "./api";
import { useCacheInvalidation, CACHE } from "@/lib/features/cacheBus";

const POLL_INTERVAL_MS = 60_000; // refresh every 60s

export function useDashboard({ poll = false }: { poll?: boolean } = {}) {
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const stats = await fetchDashboardStats();
      if (mountedRef.current) {
        dispatch({ type: "FETCH_SUCCESS", stats });
      }
    } catch (err) {
      if (mountedRef.current) {
        dispatch({
          type: "FETCH_ERROR",
          error: err instanceof Error ? err.message : "Échec du chargement du tableau de bord",
        });
      }
    }
  }, []);

  // The dashboard provider is always mounted (no per-page ensureLoaded), so invalidation
  // refreshes the KPIs immediately rather than lazily.
  useCacheInvalidation(CACHE.dashboard, () => { void refresh(); });

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  // Optional polling — paused while the tab is hidden (no point refreshing KPIs the
  // user can't see), and we refresh once immediately on re-focus so they're current.
  useEffect(() => {
    if (!poll) return;
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => { if (id === null) id = setInterval(refresh, POLL_INTERVAL_MS); };
    const stop = () => { if (id !== null) { clearInterval(id); id = null; } };
    const onVisibility = () => {
      if (document.visibilityState === "visible") { refresh(); start(); } else { stop(); }
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [poll, refresh]);

  return {
    stats: state.stats,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    refresh,
  };
}
