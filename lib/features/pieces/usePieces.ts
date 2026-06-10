// Pieces feature — public hook. Lazy cache-guarded list + stats + validation queue,
// with verify/move/rename/reject.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { piecesReducer, initialPiecesState } from "./piecesReducer";
import {
  fetchPieces,
  fetchPiecesStats,
  fetchPiecesQueue,
  verifyPiece,
  movePiece,
  renamePiece,
  rejectPiece,
} from "./api";
import { type PiecesListParams } from "./types";

export function usePieces() {
  const [state, dispatch] = useReducer(piecesReducer, initialPiecesState);
  const mountedRef = useRef(true);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;
  const loadedKeyRef = useRef<string | null>(null);
  const lastParamsRef = useRef<PiecesListParams | undefined>(undefined);
  const queueStatusRef = useRef(state.queueStatus);
  queueStatusRef.current = state.queueStatus;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async (params?: PiecesListParams) => {
    lastParamsRef.current = params;
    dispatch({ type: "FETCH_START" });
    try {
      const [data, stats] = await Promise.all([
        fetchPieces(params),
        fetchPiecesStats(params?.dossier_id).catch(() => null),
      ]);
      if (mountedRef.current) {
        dispatch({ type: "FETCH_SUCCESS", pieces: data.pieces, count: data.count });
        if (stats) dispatch({ type: "STATS_SUCCESS", stats });
      }
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "FETCH_ERROR", error: err instanceof Error ? err.message : "Failed to load pieces" });
      }
    }
  }, []);

  const ensureLoaded = useCallback(async (params?: PiecesListParams, force = false) => {
    const key = JSON.stringify(params ?? {});
    if (!force && loadedKeyRef.current === key && (statusRef.current === "loaded" || statusRef.current === "loading")) {
      return;
    }
    loadedKeyRef.current = key;
    await refresh(params);
  }, [refresh]);

  const revalidate = useCallback(() => refresh(lastParamsRef.current), [refresh]);

  // ── Validation queue (all centres, joined with centre info + statut) ───────────
  const refreshQueue = useCallback(async () => {
    dispatch({ type: "QUEUE_START" });
    try {
      const data = await fetchPiecesQueue(); // full queue; the view filters by tab client-side
      if (mountedRef.current) dispatch({ type: "QUEUE_SUCCESS", queue: data.pieces });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "QUEUE_ERROR", error: err instanceof Error ? err.message : "Failed to load queue" });
      }
    }
  }, []);

  const ensureQueue = useCallback(async (force = false) => {
    if (!force && (queueStatusRef.current === "loaded" || queueStatusRef.current === "loading")) return;
    await refreshQueue();
  }, [refreshQueue]);

  // ── Mutations (each re-pulls the queue so its statut/row reflects the backend) ──
  const verify = useCallback(async (id: string) => {
    // Optimistic: flip the queue row to validated immediately, then reconcile with the backend.
    dispatch({ type: "QUEUE_PATCH", id, patch: { statut: "valide", valide_par_humain: true, rejet_raison: null } });
    try {
      const piece = await verifyPiece(id);
      if (mountedRef.current) dispatch({ type: "PIECE_UPDATED", piece });
      void revalidate();
      void refreshQueue();
      return piece;
    } catch (err) {
      void refreshQueue(); // revert to backend truth on failure
      throw err;
    }
  }, [revalidate, refreshQueue]);

  // Validate many pieces in one go (no bulk-approve backend route yet, so this loops
  // the per-piece verify and tolerates individual failures). Returns the number
  // actually validated. See BACKEND_NOTES.md → "Bulk validation".
  const bulkVerify = useCallback(async (ids: string[]) => {
    let done = 0;
    for (const id of ids) {
      try { await verify(id); done++; } catch { /* keep going */ }
    }
    return done;
  }, [verify]);

  const move = useCallback(async (id: string, folderPath: string) => {
    const piece = await movePiece(id, folderPath);
    if (mountedRef.current) dispatch({ type: "PIECE_UPDATED", piece });
    void revalidate();
    void refreshQueue();
    return piece;
  }, [revalidate, refreshQueue]);

  const rename = useCallback(async (id: string, newName: string) => {
    const piece = await renamePiece(id, newName);
    if (mountedRef.current) dispatch({ type: "PIECE_UPDATED", piece });
    void revalidate();
    void refreshQueue();
    return piece;
  }, [revalidate, refreshQueue]);

  const reject = useCallback(async (id: string, reason: string) => {
    dispatch({ type: "QUEUE_PATCH", id, patch: { statut: "rejete", valide_par_humain: false, rejet_raison: reason } }); // optimistic instant
    try {
      const piece = await rejectPiece(id, reason);
      void revalidate();
      void refreshQueue(); // reconcile (rejected item now carries statut "rejete")
      return piece;
    } catch (err) {
      await refreshQueue();
      throw err;
    }
  }, [revalidate, refreshQueue]);

  return {
    pieces: state.list,
    count: state.count,
    stats: state.stats,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    queue: state.queue,
    queueStatus: state.queueStatus,
    isQueueLoading: state.queueStatus === "loading" || state.queueStatus === "idle",
    refresh,
    revalidate,
    ensureLoaded,
    ensureQueue,
    refreshQueue,
    verify,
    bulkVerify,
    move,
    rename,
    reject,
  };
}
