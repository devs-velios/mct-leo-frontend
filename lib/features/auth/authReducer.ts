// Auth feature — state reducer.

import { type AuthState, type AuthUser } from "./types";

export type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; user: AuthUser }
  | { type: "LOGIN_ERROR"; error: string }
  | { type: "RESTORE"; user: AuthUser }
  | { type: "LOGOUT" };

export const initialAuthState: AuthState = {
  user: null,
  status: "idle",
  error: null
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, status: "loading", error: null };
    case "LOGIN_SUCCESS":
      return { user: action.user, status: "authenticated", error: null };
    case "LOGIN_ERROR":
      return { ...state, status: "error", error: action.error };
    case "RESTORE":
      return { user: action.user, status: "authenticated", error: null };
    case "LOGOUT":
      return { ...initialAuthState };
    default:
      return state;
  }
}
