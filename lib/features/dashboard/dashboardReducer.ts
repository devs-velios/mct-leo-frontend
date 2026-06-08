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
      return { ...state, status: "loading", error: null };
    case "FETCH_SUCCESS":
      return { stats: action.stats, status: "loaded", error: null };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    default:
      return state;
  }
}
