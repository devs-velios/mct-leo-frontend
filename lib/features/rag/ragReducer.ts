// RAG feature — state reducer.

import { type RagState, type RagSuggestion } from "./types";

export type RagAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; suggestions: RagSuggestion[]; count: number }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "REVIEW_SUCCESS"; id: string };

export const initialRagState: RagState = {
  suggestions: [],
  count: 0,
  status: "idle",
  error: null,
};

export function ragReducer(state: RagState, action: RagAction): RagState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: "loading", error: null };
    case "FETCH_SUCCESS":
      return { ...state, suggestions: action.suggestions, count: action.count, status: "loaded", error: null };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    case "REVIEW_SUCCESS":
      // Drop the reviewed suggestion from the (pending) worklist optimistically.
      return {
        ...state,
        suggestions: state.suggestions.filter((s) => s.id !== action.id),
        count: Math.max(0, state.count - 1),
      };
    default:
      return state;
  }
}
