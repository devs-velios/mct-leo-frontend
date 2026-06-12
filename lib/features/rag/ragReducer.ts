// RAG feature — state reducer.

import { type RagState, type RagSuggestion, type RagSuggestionFilter } from "./types";

export type RagAction =
  | { type: "FETCH_START"; filter: RagSuggestionFilter | null }
  | { type: "FETCH_SUCCESS"; suggestions: RagSuggestion[]; count: number; filter: RagSuggestionFilter | null }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "REVIEW_SUCCESS"; id: string };

export const initialRagState: RagState = {
  suggestions: [],
  count: 0,
  status: "idle",
  error: null,
  loadedFilter: null,
};

export function ragReducer(state: RagState, action: RagAction): RagState {
  switch (action.type) {
    case "FETCH_START": {
      // Switching to a different tab? Drop the previous filter's rows now so they
      // don't flash under the new tab while its fetch is in flight.
      const switching = action.filter !== state.loadedFilter;
      return {
        ...state,
        status: "loading",
        error: null,
        suggestions: switching ? [] : state.suggestions,
        count: switching ? 0 : state.count,
      };
    }
    case "FETCH_SUCCESS":
      return { ...state, suggestions: action.suggestions, count: action.count, status: "loaded", error: null, loadedFilter: action.filter };
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
