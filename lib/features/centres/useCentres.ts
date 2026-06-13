// Centres feature — the public hook.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { centresReducer, initialCentresState } from "./centresReducer";
import {
  fetchCentres,
  fetchCentreDetail,
  createCentre,
  updateCentre,
  deleteCentre,
  fetchCentreMessages,
  uploadCentreDocument,
} from "./api";
import {
  type CreateCentrePayload,
  type UpdateCentrePayload,
  type CentreListItem,
  type CentreDetail,
} from "./types";
import { useCacheInvalidation, invalidate, CACHE } from "@/lib/features/cacheBus";

export function useCentres() {
  const [state, dispatch] = useReducer(centresReducer, initialCentresState);
  const mountedRef = useRef(true);
  // Set when invalidated elsewhere → next ensureList refetches the list slice.
  const listStaleRef = useRef(false);
  useCacheInvalidation(CACHE.centres, () => { listStaleRef.current = true; });
  // Mirror the list status in a ref so the cache-guard reads the latest value
  // without re-creating callbacks on every status change.
  const statusRef = useRef(state.listStatus);
  statusRef.current = state.listStatus;
  // Remember the last list params (e.g. limit: 200) so post-mutation revalidation
  // re-pulls the SAME slice instead of collapsing to the backend default.
  const lastListParamsRef = useRef<{ status?: string; q?: string; limit?: number; offset?: number } | undefined>(undefined);
  // Dedup concurrent first-callers (multiple components mounting in the same commit)
  // so the same list slice is only fetched once.
  const listInFlightRef = useRef<Map<string, Promise<void>>>(new Map());

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadList = useCallback(async (params?: { status?: string; q?: string; limit?: number; offset?: number }) => {
    lastListParamsRef.current = params;
    dispatch({ type: "LIST_START" });
    try {
      const data = await fetchCentres(params);
      if (mountedRef.current) {
        dispatch({ type: "LIST_SUCCESS", centres: data.centres, count: data.count });
      }
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "LIST_ERROR", error: err instanceof Error ? err.message : "Échec du chargement des centres" });
      }
    }
  }, []);

  // Re-pull the list from the backend using the last-used params (cache reconciliation).
  const revalidateList = useCallback(() => loadList(lastListParamsRef.current), [loadList]);

  // Cache-guard: only fetches the list the first time it is needed. Subsequent
  // callers (across page navigations, while the provider stays mounted) reuse
  // the cached state. Pass force=true to bypass the guard.
  const ensureList = useCallback(async (
    params?: { status?: string; q?: string; limit?: number; offset?: number },
    force = false,
  ) => {
    const key = JSON.stringify(params ?? {});
    if (!force && !listStaleRef.current) {
      if (statusRef.current === "loaded") return;
      const pending = listInFlightRef.current.get(key);
      if (pending) return pending; // a concurrent caller already started this fetch
    }
    listStaleRef.current = false;
    const p = loadList(params).finally(() => { listInFlightRef.current.delete(key); });
    listInFlightRef.current.set(key, p);
    return p;
  }, [loadList]);

  const loadDetail = useCallback(async (id: string) => {
    dispatch({ type: "DETAIL_START" });
    try {
      const detail = await fetchCentreDetail(id);
      if (mountedRef.current) {
        dispatch({ type: "DETAIL_SUCCESS", detail });
      }
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "DETAIL_ERROR", error: err instanceof Error ? err.message : "Échec du chargement du centre" });
      }
    }
  }, []);

  // Mirror the list in a ref so navigation helpers read the latest rows without
  // re-creating their callbacks on every list change.
  const listRef = useRef(state.list);
  listRef.current = state.list;
  // Mirror the per-id detail cache in a ref so the guard reads the latest value
  // without re-creating the callback, and dedup concurrent detail fetches.
  const detailCacheRef = useRef(state.detailCache);
  detailCacheRef.current = state.detailCache;
  const detailInFlightRef = useRef<Map<string, Promise<void>>>(new Map());
  // In-flight dedup for getDetail (returns the data; cache-only write).
  const getInFlightRef = useRef<Map<string, Promise<CentreDetail>>>(new Map());

  // Cache-guarded detail loader: serves a cached centre instantly and only hits
  // the backend the first time (or with force=true). Use this from pages instead
  // of calling fetchCentreDetail directly.
  const ensureDetail = useCallback(async (id: string, force = false) => {
    if (!force) {
      const cached = detailCacheRef.current[id];
      if (cached) { dispatch({ type: "DETAIL_FROM_CACHE", detail: cached }); return; }
      const pending = detailInFlightRef.current.get(id);
      if (pending) return pending;
      // Reuse an in-flight hover prefetch (getDetail) instead of firing a 2nd fetch,
      // so clicking a row the user just hovered resolves from that single request.
      const prefetch = getInFlightRef.current.get(id);
      if (prefetch) {
        const reused = prefetch
          .then((d) => { if (mountedRef.current) dispatch({ type: "DETAIL_FROM_CACHE", detail: d }); })
          .catch(() => {})
          .finally(() => { detailInFlightRef.current.delete(id); });
        detailInFlightRef.current.set(id, reused);
        return reused;
      }
    }
    const p = loadDetail(id).finally(() => { detailInFlightRef.current.delete(id); });
    detailInFlightRef.current.set(id, p);
    return p;
  }, [loadDetail]);

  // Returns the centre detail (cached if available, deduped, refreshed with force=true)
  // and caches it WITHOUT touching the "current" detail. Use this from views that keep
  // their own local state (dossier hub, map) but still want the shared cache.
  const getDetail = useCallback(async (id: string, force = false): Promise<CentreDetail> => {
    if (!force) {
      const cached = detailCacheRef.current[id];
      if (cached) return cached;
      const pending = getInFlightRef.current.get(id);
      if (pending) return pending;
    }
    const p = fetchCentreDetail(id)
      .then((d) => { if (mountedRef.current) dispatch({ type: "DETAIL_CACHE_SET", detail: d }); return d; })
      .finally(() => { getInFlightRef.current.delete(id); });
    getInFlightRef.current.set(id, p);
    return p;
  }, []);

  // Resolve a centre's most-recent dossier id for navigation (centre switcher →
  // open that centre's dossier hub). Reads the cached list row first (instant, no
  // network); falls back to the centre detail when the row carries no dossier id.
  // Warms the shared detail cache either way so the destination view reads it
  // instantly instead of waterfalling a fresh fetch. Returns null if the centre
  // has no dossier (caller should route to the centre page instead).
  const resolveLatestDossierId = useCallback(async (centreId: string): Promise<string | null> => {
    const fromList = listRef.current.find((c) => c.id === centreId)?.dossier_id ?? null;
    const detailPromise = getDetail(centreId); // warm cache (deduped, cache-first)
    if (fromList) return fromList;
    try {
      const detail = await detailPromise; // reuse the in-flight prefetch (no second fetch)
      return detail.dossiers?.[detail.dossiers.length - 1]?.id ?? null;
    } catch {
      return null;
    }
  }, [getDetail]);

  const create = useCallback(async (payload: CreateCentrePayload) => {
    const result = await createCentre(payload);
    // Re-pull the list (same slice) from the backend after creation.
    revalidateList();
    // A new centre (+ its dossier) shows up everywhere → refresh dependents.
    invalidate(CACHE.dossiers, CACHE.dashboard, CACHE.heatmap);
    return result;
  }, [revalidateList]);

  const update = useCallback(async (id: string, payload: UpdateCentrePayload) => {
    const result = await updateCentre(id, payload);
    // Re-pull detail and the list slice from the backend.
    loadDetail(id);
    revalidateList();
    return result;
  }, [loadDetail, revalidateList]);

  const remove = useCallback(async (id: string) => {
    if (mountedRef.current) dispatch({ type: "DELETE_SUCCESS", id }); // optimistic
    try {
      const result = await deleteCentre(id);
      void revalidateList(); // reconcile with backend
      invalidate(CACHE.dossiers, CACHE.dashboard, CACHE.heatmap);
      return result;
    } catch (err) {
      await revalidateList();
      throw err;
    }
  }, [revalidateList]);

  const clearDetail = useCallback(() => {
    dispatch({ type: "CLEAR_DETAIL" });
  }, []);

  // Patch a single cached list row in place (e.g. after an inline edit) without
  // refetching the whole list — keeps any active limit/filter intact.
  const patchListItem = useCallback((id: string, updates: Partial<CentreListItem>) => {
    dispatch({ type: "UPDATE_LIST_ITEM", id, updates });
  }, []);

  const loadMessages = useCallback(async (centreId: string, limit?: number) => {
    return fetchCentreMessages(centreId, limit);
  }, []);

  const upload = useCallback(async (
    centreId: string,
    file: File,
    type: string,
    opts?: { folder?: string; name?: string; verified?: boolean }
  ) => {
    const result = await uploadCentreDocument(centreId, file, type, opts);
    // Re-pull detail (and list slice — a new piece can change pieces_stats) from backend.
    loadDetail(centreId);
    void revalidateList();
    return result;
  }, [loadDetail, revalidateList]);

  return {
    centres: state.list,
    count: state.count,
    detail: state.detail,
    detailCache: state.detailCache,
    listStatus: state.listStatus,
    detailStatus: state.detailStatus,
    isListLoading: state.listStatus === "loading" || state.listStatus === "idle",
    isDetailLoading: state.detailStatus === "loading",
    error: state.error,
    loadList,
    ensureList,
    revalidateList,
    loadDetail,
    ensureDetail,
    getDetail,
    resolveLatestDossierId,
    create,
    update,
    remove,
    clearDetail,
    patchListItem,
    loadMessages,
    upload,
  };
}
