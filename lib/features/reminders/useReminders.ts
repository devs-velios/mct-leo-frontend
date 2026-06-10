// Reminders feature — public hook. Lazy cache-guarded list + create/edit/stop/delete.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { remindersReducer, initialRemindersState } from "./remindersReducer";
import {
  fetchReminders,
  createReminder,
  updateReminder,
  stopReminder,
  deleteReminder,
} from "./api";
import { type CreateReminderPayload, type UpdateReminderPayload } from "./types";

export function useReminders() {
  const [state, dispatch] = useReducer(remindersReducer, initialRemindersState);
  const mountedRef = useRef(true);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;
  const loadedKeyRef = useRef<string | null>(null);
  const lastParamsRef = useRef<{ dossier_id?: string; status?: string } | undefined>(undefined);
  // Dedup concurrent first-callers (e.g. RemindersView + dashboard RemindersByDueDate).
  const inFlightRef = useRef<Map<string, Promise<void>>>(new Map());

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async (params?: { dossier_id?: string; status?: string }) => {
    lastParamsRef.current = params;
    dispatch({ type: "FETCH_START" });
    try {
      const data = await fetchReminders(params);
      if (mountedRef.current) dispatch({ type: "FETCH_SUCCESS", reminders: data.reminders, count: data.count });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "FETCH_ERROR", error: err instanceof Error ? err.message : "Échec du chargement des rappels" });
      }
    }
  }, []);

  // Re-pull from backend with the last-used filter (cache reconciliation).
  const revalidate = useCallback(() => refresh(lastParamsRef.current), [refresh]);

  const ensureLoaded = useCallback(async (params?: { dossier_id?: string; status?: string }, force = false) => {
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

  const create = useCallback(async (payload: CreateReminderPayload) => {
    const reminder = await createReminder(payload);
    // The POST returns at least the id; re-pull to keep derived fields (kind/escalation) accurate.
    await revalidate();
    return reminder;
  }, [revalidate]);

  const update = useCallback(async (id: string, payload: UpdateReminderPayload) => {
    const reminder = await updateReminder(id, payload);
    if (mountedRef.current) dispatch({ type: "UPSERT", reminder });
    await revalidate();
    return reminder;
  }, [revalidate]);

  const stop = useCallback(async (id: string) => {
    if (mountedRef.current) dispatch({ type: "SET_STATUS", id, status: "cancelled" }); // optimistic
    try {
      const result = await stopReminder(id);
      void revalidate(); // reconcile with backend
      return result;
    } catch (err) {
      await revalidate();
      throw err;
    }
  }, [revalidate]);

  const remove = useCallback(async (id: string) => {
    if (mountedRef.current) dispatch({ type: "REMOVE", id }); // optimistic
    try {
      const result = await deleteReminder(id);
      void revalidate();
      return result;
    } catch (err) {
      await revalidate();
      throw err;
    }
  }, [revalidate]);

  return {
    reminders: state.list,
    count: state.count,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    refresh,
    revalidate,
    ensureLoaded,
    create,
    update,
    stop,
    remove,
  };
}
