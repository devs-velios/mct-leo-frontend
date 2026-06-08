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
} from "./types";

export function useCentres() {
  const [state, dispatch] = useReducer(centresReducer, initialCentresState);
  const mountedRef = useRef(true);
  // Mirror the list status in a ref so the cache-guard reads the latest value
  // without re-creating callbacks on every status change.
  const statusRef = useRef(state.listStatus);
  statusRef.current = state.listStatus;
  // Remember the last list params (e.g. limit: 200) so post-mutation revalidation
  // re-pulls the SAME slice instead of collapsing to the backend default.
  const lastListParamsRef = useRef<{ status?: string; q?: string; limit?: number; offset?: number } | undefined>(undefined);

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
        dispatch({ type: "LIST_ERROR", error: err instanceof Error ? err.message : "Failed to load centres" });
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
    if (!force && (statusRef.current === "loaded" || statusRef.current === "loading")) return;
    await loadList(params);
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
        dispatch({ type: "DETAIL_ERROR", error: err instanceof Error ? err.message : "Failed to load centre" });
      }
    }
  }, []);

  const create = useCallback(async (payload: CreateCentrePayload) => {
    const result = await createCentre(payload);
    // Re-pull the list (same slice) from the backend after creation.
    revalidateList();
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
    listStatus: state.listStatus,
    detailStatus: state.detailStatus,
    isListLoading: state.listStatus === "loading" || state.listStatus === "idle",
    isDetailLoading: state.detailStatus === "loading",
    error: state.error,
    loadList,
    ensureList,
    revalidateList,
    loadDetail,
    create,
    update,
    remove,
    clearDetail,
    patchListItem,
    loadMessages,
    upload,
  };
}
