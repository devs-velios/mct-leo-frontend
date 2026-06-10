// Folders feature — public hook. Cached folder catalog + routing, create/rename/repoint.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { foldersReducer, initialFoldersState } from "./foldersReducer";
import { fetchFolders, createFolder, updateFolder, setRouting } from "./api";
import { type CreateFolderPayload, type UpdateFolderPayload } from "./types";

export function useFolders() {
  const [state, dispatch] = useReducer(foldersReducer, initialFoldersState);
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
      const data = await fetchFolders();
      if (mountedRef.current) dispatch({ type: "FETCH_SUCCESS", folders: data.folders, routing: data.routing });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "FETCH_ERROR", error: err instanceof Error ? err.message : "Échec du chargement des dossiers Drive" });
      }
    }
  }, []);

  const ensureLoaded = useCallback(async (force = false) => {
    if (!force && (statusRef.current === "loaded" || statusRef.current === "loading")) return;
    await refresh();
  }, [refresh]);

  const addFolder = useCallback(async (payload: CreateFolderPayload) => {
    const folder = await createFolder(payload);
    if (mountedRef.current) dispatch({ type: "FOLDER_ADDED", folder }); // optimistic
    void refresh(); // reconcile with backend
    return folder;
  }, [refresh]);

  const renameFolder = useCallback(async (id: string, payload: UpdateFolderPayload) => {
    const folder = await updateFolder(id, payload);
    if (mountedRef.current) dispatch({ type: "FOLDER_UPDATED", folder });
    void refresh();
    return folder;
  }, [refresh]);

  const repoint = useCallback(async (doc_key: string, folder_name: string) => {
    if (mountedRef.current) dispatch({ type: "ROUTING_UPDATED", doc_key, folder_name }); // optimistic
    try {
      const result = await setRouting(doc_key, folder_name);
      void refresh(); // reconcile with backend
      return result;
    } catch (err) {
      await refresh();
      throw err;
    }
  }, [refresh]);

  return {
    folders: state.folders,
    routing: state.routing,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    refresh,
    revalidate: refresh,
    ensureLoaded,
    addFolder,
    renameFolder,
    repoint,
  };
}
