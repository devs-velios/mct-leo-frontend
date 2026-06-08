// Auth feature — shared types.

export interface AuthUser {
  email: string;
}

export type AuthStatus = "idle" | "loading" | "authenticated" | "error";

export interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
}
