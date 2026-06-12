// Direction heat-map feature — public hook. Lazy cache-guarded matrix with
// adjustable green/orange/red day thresholds (re-queries the backend on change).

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { heatmapReducer, initialHeatmapState } from "./heatmapReducer";
import { fetchPipelineHeatmap } from "./api";
import { type HeatmapQuery, type HeatmapThresholds } from "./types";

export function useHeatmap() {
  const [state, dispatch] = useReducer(heatmapReducer, initialHeatmapState);
  const mountedRef = useRef(true);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;
  // Mirror the active thresholds so refresh() reads the latest without re-creating itself.
  const thresholdsRef = useRef(state.thresholds);
  thresholdsRef.current = state.thresholds;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async (q?: HeatmapQuery) => {
    dispatch({ type: "FETCH_START" });
    const query: HeatmapQuery = q ?? thresholdsRef.current;
    try {
      const data = await fetchPipelineHeatmap(query);
      if (mountedRef.current) dispatch({ type: "SET_DATA", data });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "FETCH_ERROR", error: err instanceof Error ? err.message : "Échec du chargement de la heat map" });
      }
    }
  }, []);

  // Fetch once; reuse cached state on later mounts. force=true bypasses the guard.
  const ensureLoaded = useCallback(async (force = false) => {
    if (!force && (statusRef.current === "loaded" || statusRef.current === "loading")) return;
    await refresh();
  }, [refresh]);

  // Change thresholds → store them and re-query with the new bounds.
  const setThresholds = useCallback(async (thresholds: HeatmapThresholds) => {
    dispatch({ type: "SET_THRESHOLDS", thresholds });
    await refresh(thresholds);
  }, [refresh]);

  return {
    data: state.data,
    phases: state.data?.phases ?? [],
    rows: state.data?.rows ?? [],
    thresholds: state.thresholds,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    refresh,
    ensureLoaded,
    setThresholds,
  };
}
