// RAG feature — public hook. Lazy cache-guarded review queue + approve/reject mutations.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { ragReducer, initialRagState } from "./ragReducer";
import { fetchSuggestions, approveSuggestion, rejectSuggestion } from "./api";
import { type RagSuggestionFilter } from "./types";

type ListParams = { status?: RagSuggestionFilter; centre_id?: string };

export function useRag() {
  const [state, dispatch] = useReducer(ragReducer, initialRagState);
  const mountedRef = useRef(true);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;
  // Remember which filter the cache currently holds, so switching tabs (pending ↔
  // approved ↔ rejected) refetches but revisiting the same one is cached.
  const loadedKeyRef = useRef<string | null>(null);
  const lastParamsRef = useRef<ListParams | undefined>(undefined);
  // Dedup concurrent first-callers.
  const inFlightRef = useRef<Map<string, Promise<void>>>(new Map());

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async (params?: ListParams) => {
    lastParamsRef.current = params;
    dispatch({ type: "FETCH_START" });
    try {
      const data = await fetchSuggestions(params);
      if (mountedRef.current) dispatch({ type: "FETCH_SUCCESS", suggestions: data.suggestions, count: data.count });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "FETCH_ERROR", error: err instanceof Error ? err.message : "Failed to load suggestions" });
      }
    }
  }, []);

  // Re-pull using the last-used filter (cache reconciliation).
  const revalidate = useCallback(() => refresh(lastParamsRef.current), [refresh]);

  // Fetch once per filter; reuse cached state on later mounts. force=true bypasses the guard.
  const ensureLoaded = useCallback(async (params?: ListParams, force = false) => {
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

  // Approve (optionally editing the draft) → backend sends it to the client. Optimistic
  // removal from the pending worklist; reconcile from the backend on failure.
  const approve = useCallback(async (id: string, answer?: string | null) => {
    if (mountedRef.current) dispatch({ type: "REVIEW_SUCCESS", id });
    try {
      return await approveSuggestion(id, answer);
    } catch (err) {
      await revalidate();
      throw err;
    }
  }, [revalidate]);

  const reject = useCallback(async (id: string) => {
    if (mountedRef.current) dispatch({ type: "REVIEW_SUCCESS", id });
    try {
      return await rejectSuggestion(id);
    } catch (err) {
      await revalidate();
      throw err;
    }
  }, [revalidate]);

  // Bulk approve/reject the selected suggestions (no bulk backend route — loop the
  // per-item calls, tolerate individual failures). Returns the number processed.
  const approveMany = useCallback(async (ids: string[]) => {
    let done = 0;
    for (const id of ids) {
      try { await approve(id); done++; } catch { /* keep going */ }
    }
    return done;
  }, [approve]);

  const rejectMany = useCallback(async (ids: string[]) => {
    let done = 0;
    for (const id of ids) {
      try { await reject(id); done++; } catch { /* keep going */ }
    }
    return done;
  }, [reject]);

  return {
    suggestions: state.suggestions,
    count: state.count,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    refresh,
    revalidate,
    ensureLoaded,
    approve,
    reject,
    approveMany,
    rejectMany,
  };
}
