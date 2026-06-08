// Auth feature — role context. Fetches GET /api/auth/me once and exposes the
// current user's role + a `canWrite` flag so views can gate write actions
// (the backend also enforces RBAC: `direction` is read-only).

"use client";

import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from "react";
import { fetchMe } from "./api";

type Role = "operateur" | "direction" | null;

interface RoleState {
  role: Role;
  loaded: boolean;
}

interface RoleContextValue {
  role: Role;
  loaded: boolean;
  // Until the role resolves we optimistically allow writes (the backend still guards);
  // once loaded, only non-direction roles may write.
  canWrite: boolean;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

function reducer(_state: RoleState, role: Role): RoleState {
  return { role, loaded: true };
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { role: null, loaded: false });
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    fetchMe()
      .then((me) => dispatch(me.role))
      .catch(() => dispatch(null));
  }, []);

  const canWrite = !state.loaded || state.role !== "direction";

  return (
    <RoleContext.Provider value={{ role: state.role, loaded: state.loaded, canWrite }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return ctx;
}
