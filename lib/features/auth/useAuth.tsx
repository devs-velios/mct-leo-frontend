// Auth feature — the public hook. Wires the reducer to the api layer and keeps
// a lightweight client mirror of the session in sessionStorage (the secure part
// of the session lives in an httpOnly cookie set by the server).

"use client";

import { useReducer, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authReducer, initialAuthState } from "./authReducer";
import { loginRequest, logoutRequest } from "./authApi";
import { type LoginCredentials, type AuthUser } from "./types";

const STORAGE_KEY = "mct_auth_user";

// Backwards-compatible keys still read by existing screens.
const LEGACY_LOGGED_IN = "isLoggedIn";
const LEGACY_EMAIL = "userEmail";

function persist(user: AuthUser) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  sessionStorage.setItem(LEGACY_LOGGED_IN, "true");
  sessionStorage.setItem(LEGACY_EMAIL, user.email);
}

function clearPersisted() {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(LEGACY_LOGGED_IN);
  sessionStorage.removeItem(LEGACY_EMAIL);
}

export function useAuth() {
  const router = useRouter();
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Restore the session from sessionStorage or the server session API after hydration.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          dispatch({ type: "RESTORE", user: JSON.parse(raw) as AuthUser });
        } else {
          // If sessionStorage is empty, query the server session API to check if session cookie is alive
          const res = await fetch("/api/auth/session");
          if (res.ok) {
            const data = await res.json();
            if (data?.user) {
              persist(data.user);
              dispatch({ type: "RESTORE", user: data.user });
            }
          }
        }
      } catch {
        // ignore errors
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    dispatch({ type: "LOGIN_START" });
    try {
      const { user } = await loginRequest(credentials);
      persist(user);
      dispatch({ type: "LOGIN_SUCCESS", user });
      return user;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connexion impossible.";
      dispatch({ type: "LOGIN_ERROR", error: message });
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    clearPersisted();
    dispatch({ type: "LOGOUT" });
    router.push("/");
  }, [router]);

  return {
    user: state.user,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading",
    isAuthenticated: state.status === "authenticated" || state.user !== null,
    login,
    logout
  };
}
