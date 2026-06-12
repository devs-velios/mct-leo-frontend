// Required documents feature — public hook. Lazy cache-guarded list + create/update/delete.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { requiredDocumentsReducer, initialRequiredDocumentsState } from "./requiredDocumentsReducer";
import {
  fetchRequiredDocuments,
  createRequiredDocument,
  updateRequiredDocument,
  deleteRequiredDocument,
} from "./api";
import { type CreateRequiredDocumentPayload, type UpdateRequiredDocumentPayload } from "./types";

export function useRequiredDocuments() {
  const [state, dispatch] = useReducer(requiredDocumentsReducer, initialRequiredDocumentsState);
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
      const data = await fetchRequiredDocuments();
      if (mountedRef.current) dispatch({ type: "FETCH_SUCCESS", documents: data.documents ?? [] });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "FETCH_ERROR", error: err instanceof Error ? err.message : "Échec du chargement des documents requis" });
      }
    }
  }, []);

  const ensureLoaded = useCallback(async (force = false) => {
    if (!force && (statusRef.current === "loaded" || statusRef.current === "loading")) return;
    await refresh();
  }, [refresh]);

  const create = useCallback(async (payload: CreateRequiredDocumentPayload) => {
    const document = await createRequiredDocument(payload);
    if (mountedRef.current) dispatch({ type: "UPSERT", document });
    return document;
  }, []);

  const update = useCallback(async (id: string, payload: UpdateRequiredDocumentPayload) => {
    const document = await updateRequiredDocument(id, payload);
    if (mountedRef.current) dispatch({ type: "UPSERT", document });
    return document;
  }, []);

  const remove = useCallback(async (id: string) => {
    if (mountedRef.current) dispatch({ type: "REMOVE", id }); // optimistic
    try {
      return await deleteRequiredDocument(id);
    } catch (err) {
      await refresh(); // reconcile on failure
      throw err;
    }
  }, [refresh]);

  return {
    documents: state.list,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    refresh,
    ensureLoaded,
    create,
    update,
    remove,
  };
}
