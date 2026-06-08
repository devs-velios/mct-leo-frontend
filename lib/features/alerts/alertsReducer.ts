// Alerts feature — state reducer.

import { type AlertsState, type Alert } from "./types";

export type AlertsAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; alerts: Alert[]; count: number }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "RESOLVE_SUCCESS"; id: string };

export const initialAlertsState: AlertsState = {
  alerts: [],
  count: 0,
  status: "idle",
  error: null,
};

export function alertsReducer(state: AlertsState, action: AlertsAction): AlertsState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: "loading", error: null };
    case "FETCH_SUCCESS":
      return { ...state, alerts: action.alerts, count: action.count, status: "loaded", error: null };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    case "RESOLVE_SUCCESS":
      // Drop the resolved alert from the (open) worklist optimistically.
      return {
        ...state,
        alerts: state.alerts.filter((a) => a.id !== action.id),
        count: Math.max(0, state.count - 1),
      };
    default:
      return state;
  }
}
