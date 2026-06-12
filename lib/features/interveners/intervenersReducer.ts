// Interveners feature — reducer.

import { type IntervenersState, type Intervener, type IntervenerCategory } from "./types";

export const initialIntervenersState: IntervenersState = {
  list: [],
  categories: [],
  categoryOptions: [],
  status: "idle",
  error: null,
};

export type IntervenersAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; interveners: Intervener[]; categories: string[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "SET_CATEGORY_OPTIONS"; categoryOptions: IntervenerCategory[] }
  | { type: "UPSERT"; intervener: Intervener }
  | { type: "REMOVE"; id: string };

export function intervenersReducer(state: IntervenersState, action: IntervenersAction): IntervenersState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: state.status === "loaded" ? "loaded" : "loading", error: null };
    case "FETCH_SUCCESS":
      return { ...state, list: action.interveners, categories: action.categories, status: "loaded", error: null };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    case "SET_CATEGORY_OPTIONS":
      return { ...state, categoryOptions: action.categoryOptions };
    case "UPSERT": {
      const exists = state.list.some((i) => i.id === action.intervener.id);
      const list = exists
        ? state.list.map((i) => (i.id === action.intervener.id ? action.intervener : i))
        : [action.intervener, ...state.list]; // newest-first
      return { ...state, list };
    }
    case "REMOVE":
      return { ...state, list: state.list.filter((i) => i.id !== action.id) };
    default:
      return state;
  }
}
