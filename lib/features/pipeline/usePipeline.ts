// Pipeline catalog feature — public hook. Lazy cache-guarded catalog + add/edit/
// delete/reorder mutations. Every mutation replaces local state with the backend's
// full response (the catalog is renumbered server-side), so there's nothing to patch.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { pipelineReducer, initialPipelineState } from "./pipelineReducer";
import { fetchPipeline, addPhase, editPhase, deletePhase } from "./api";
import { type AddPhasePayload, type EditPhasePayload } from "./types";

export function usePipeline() {
  const [state, dispatch] = useReducer(pipelineReducer, initialPipelineState);
  const mountedRef = useRef(true);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const catalog = await fetchPipeline();
      if (mountedRef.current) dispatch({ type: "SET_CATALOG", catalog });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "FETCH_ERROR", error: err instanceof Error ? err.message : "Échec du chargement du pipeline" });
      }
    }
  }, []);

  // Fetch once; reuse cached state on later mounts. force=true bypasses the guard.
  const ensureLoaded = useCallback(async (force = false) => {
    if (!force && (statusRef.current === "loaded" || statusRef.current === "loading")) return;
    await refresh();
  }, [refresh]);

  // Mutations — the backend returns the full updated { phases, macro_options }.
  const add = useCallback(async (payload: AddPhasePayload) => {
    const catalog = await addPhase(payload);
    if (mountedRef.current) dispatch({ type: "SET_CATALOG", catalog });
    return catalog;
  }, []);

  const edit = useCallback(async (phase: string, payload: EditPhasePayload) => {
    const catalog = await editPhase(phase, payload);
    if (mountedRef.current) dispatch({ type: "SET_CATALOG", catalog });
    return catalog;
  }, []);

  const remove = useCallback(async (phase: string) => {
    const catalog = await deletePhase(phase);
    if (mountedRef.current) dispatch({ type: "SET_CATALOG", catalog });
    return catalog;
  }, []);

  // Reorder a phase to a new 1-based position (the backend renumbers the rest).
  const move = useCallback((phase: string, step_order: number) => edit(phase, { step_order }), [edit]);

  return {
    phases: state.phases,
    macroOptions: state.macroOptions,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    refresh,
    ensureLoaded,
    add,
    edit,
    remove,
    move,
  };
}
