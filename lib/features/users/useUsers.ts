// Users feature — public hook. Invite (Léo backend) + list/remove (frontend server routes).

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { usersReducer, initialUsersState } from "./usersReducer";
import { inviteUser, fetchUsers, deleteUser } from "./api";
import { type InviteUserPayload } from "./types";

export function useUsers() {
  const [state, dispatch] = useReducer(usersReducer, initialUsersState);
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
      const data = await fetchUsers();
      if (mountedRef.current) dispatch({ type: "FETCH_SUCCESS", users: data.users });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "FETCH_ERROR", error: err instanceof Error ? err.message : "Échec du chargement des utilisateurs" });
      }
    }
  }, []);

  const ensureLoaded = useCallback(async (force = false) => {
    if (!force && (statusRef.current === "loaded" || statusRef.current === "loading")) return;
    await refresh();
  }, [refresh]);

  // Throws ApiError on failure so callers can map status codes to messages.
  const invite = useCallback(async (payload: InviteUserPayload) => {
    const result = await inviteUser(payload);
    if (mountedRef.current) dispatch({ type: "INVITED", result });
    void refresh(); // pull the freshly-invited user into the directory
    return result;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    if (mountedRef.current) dispatch({ type: "REMOVE", id }); // optimistic
    try {
      return await deleteUser(id);
    } catch (err) {
      await refresh(); // reconcile on failure
      throw err;
    }
  }, [refresh]);

  return {
    users: state.list,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    invited: state.invited,
    refresh,
    ensureLoaded,
    invite,
    remove,
  };
}
