// Interveners feature — public hook. Lazy cache-guarded list + create/update/delete.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { intervenersReducer, initialIntervenersState } from "./intervenersReducer";
import { fetchInterveners, fetchIntervenerCategories, createIntervener, updateIntervener, deleteIntervener } from "./api";
import { type CreateIntervenerPayload, type UpdateIntervenerPayload } from "./types";

export function useInterveners() {
  const [state, dispatch] = useReducer(intervenersReducer, initialIntervenersState);
  const mountedRef = useRef(true);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;
  const categoriesLoadedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // The fixed category catalog (value + description) — loaded once for the form dropdown.
  const ensureCategories = useCallback(async () => {
    if (categoriesLoadedRef.current) return;
    categoriesLoadedRef.current = true;
    try {
      const { categories } = await fetchIntervenerCategories();
      if (mountedRef.current) dispatch({ type: "SET_CATEGORY_OPTIONS", categoryOptions: categories ?? [] });
    } catch {
      categoriesLoadedRef.current = false; // allow a retry
    }
  }, []);

  const refresh = useCallback(async (category?: string) => {
    dispatch({ type: "FETCH_START" });
    try {
      const data = await fetchInterveners(category);
      if (mountedRef.current) {
        dispatch({ type: "FETCH_SUCCESS", interveners: data.interveners, categories: data.categories ?? [] });
      }
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "FETCH_ERROR", error: err instanceof Error ? err.message : "Échec du chargement des intervenants" });
      }
    }
  }, []);

  // Fetch once; reuse cached state on later mounts. force=true bypasses the guard.
  const ensureLoaded = useCallback(async (force = false) => {
    void ensureCategories();
    if (!force && (statusRef.current === "loaded" || statusRef.current === "loading")) return;
    await refresh();
  }, [refresh, ensureCategories]);

  const create = useCallback(async (payload: CreateIntervenerPayload) => {
    const intervener = await createIntervener(payload);
    if (mountedRef.current) dispatch({ type: "UPSERT", intervener });
    return intervener;
  }, []);

  const update = useCallback(async (id: string, payload: UpdateIntervenerPayload) => {
    const intervener = await updateIntervener(id, payload);
    if (mountedRef.current) dispatch({ type: "UPSERT", intervener });
    return intervener;
  }, []);

  const remove = useCallback(async (id: string) => {
    if (mountedRef.current) dispatch({ type: "REMOVE", id }); // optimistic
    try {
      return await deleteIntervener(id);
    } catch (err) {
      await refresh(); // reconcile on failure
      throw err;
    }
  }, [refresh]);

  return {
    interveners: state.list,
    categories: state.categories,
    /** Detailed categories (value + description) for the form dropdown. */
    categoryOptions: state.categoryOptions,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    refresh,
    ensureLoaded,
    ensureCategories,
    create,
    update,
    remove,
  };
}
