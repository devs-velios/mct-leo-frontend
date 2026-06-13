// Dashboard feature — state reducer.

import { type DashboardState, type DashboardStats } from "./types";

export type DashboardAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; stats: DashboardStats }
  | { type: "FETCH_ERROR"; error: string };

export const initialDashboardState: DashboardState = {
  stats: null,
  status: "idle",
  error: null,
};

export function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "FETCH_START":
      // Stale-while-revalidate: only show the loading skeleton on the very first load.
      // Background refreshes (60s poll, tab re-focus, cache-bus invalidation) keep the
      // current stats on screen and swap them in silently on success — no flicker.
      return { ...state, status: state.stats ? "loaded" : "loading", error: null };
    case "FETCH_SUCCESS":
      return { stats: action.stats, status: "loaded", error: null };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    default:
      return state;
  }
}
