// Dashboard feature — the public hook. Auto-fetches stats on mount with optional
// polling. Can be used standalone or through the DashboardProvider context.

"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import { dashboardReducer, initialDashboardState } from "./dashboardReducer";
import { fetchDashboardStats } from "./api";

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
          error: err instanceof Error ? err.message : "Failed to load dashboard",
        });
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  // Optional polling
  useEffect(() => {
    if (!poll) return;
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll, refresh]);

  return {
    stats: state.stats,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    refresh,
  };
}
