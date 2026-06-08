// Simulate feature — state reducer (last run result).

import { type SimulateState, type SimulateOdooResult } from "./types";

export type SimulateAction =
  | { type: "RUN_START" }
  | { type: "RUN_SUCCESS"; result: SimulateOdooResult }
  | { type: "RUN_ERROR"; error: string }
  | { type: "RESET" };

export const initialSimulateState: SimulateState = {
  status: "idle",
  result: null,
  error: null,
};

export function simulateReducer(state: SimulateState, action: SimulateAction): SimulateState {
  switch (action.type) {
    case "RUN_START":
      return { ...state, status: "loading", error: null, result: null };
    case "RUN_SUCCESS":
      return { ...state, status: "success", result: action.result };
    case "RUN_ERROR":
      return { ...state, status: "error", error: action.error };
    case "RESET":
      return initialSimulateState;
    default:
      return state;
  }
}
