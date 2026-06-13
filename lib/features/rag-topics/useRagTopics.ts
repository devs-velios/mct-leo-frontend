// RAG topics feature — public hook. Lazy cache-guarded list + create/update/delete.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { ragTopicsReducer, initialRagTopicsState } from "./ragTopicsReducer";
import { fetchRagTopics, createRagTopic, updateRagTopic, deleteRagTopic } from "./api";
import { type CreateRagTopicPayload, type UpdateRagTopicPayload } from "./types";

export function useRagTopics() {
  const [state, dispatch] = useReducer(ragTopicsReducer, initialRagTopicsState);
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
      const data = await fetchRagTopics();
      if (mountedRef.current) dispatch({ type: "FETCH_SUCCESS", topics: data.topics ?? [] });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "FETCH_ERROR", error: err instanceof Error ? err.message : "Échec du chargement des sujets" });
      }
    }
  }, []);

  const ensureLoaded = useCallback(async (force = false) => {
    if (!force && (statusRef.current === "loaded" || statusRef.current === "loading")) return;
    await refresh();
  }, [refresh]);

  const create = useCallback(async (payload: CreateRagTopicPayload) => {
    const topic = await createRagTopic(payload);
    if (mountedRef.current) dispatch({ type: "UPSERT", topic });
    return topic;
  }, []);

  const update = useCallback(async (section: string, payload: UpdateRagTopicPayload) => {
    // Optimistic toggle so the switch feels instant; reconcile/revert on failure.
    const prev = state.list.find((t) => t.section === section);
    if (mountedRef.current && prev) dispatch({ type: "UPSERT", topic: { ...prev, ...payload } });
    try {
      const topic = await updateRagTopic(section, payload);
      if (mountedRef.current) dispatch({ type: "UPSERT", topic });
      return topic;
    } catch (err) {
      if (mountedRef.current && prev) dispatch({ type: "UPSERT", topic: prev }); // revert
      throw err;
    }
  }, [state.list]);

  const remove = useCallback(async (section: string) => {
    if (mountedRef.current) dispatch({ type: "REMOVE", section }); // optimistic
    try {
      return await deleteRagTopic(section);
    } catch (err) {
      await refresh(); // reconcile on failure
      throw err;
    }
  }, [refresh]);

  return {
    topics: state.list,
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
