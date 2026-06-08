// Users feature — public hook. Invite-only (no backend list endpoint).

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { usersReducer, initialUsersState } from "./usersReducer";
import { inviteUser } from "./api";
import { type InviteUserPayload } from "./types";

export function useUsers() {
  const [state, dispatch] = useReducer(usersReducer, initialUsersState);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Throws ApiError on failure so callers can map status codes to messages.
  const invite = useCallback(async (payload: InviteUserPayload) => {
    const result = await inviteUser(payload);
    if (mountedRef.current) dispatch({ type: "INVITED", result });
    return result;
  }, []);

  return {
    invited: state.invited,
    invite,
  };
}
