// Required documents feature — reducer.

import { type RequiredDocumentsState, type RequiredDocument } from "./types";

export const initialRequiredDocumentsState: RequiredDocumentsState = {
  list: [],
  status: "idle",
  error: null,
};

export type RequiredDocumentsAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; documents: RequiredDocument[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "UPSERT"; document: RequiredDocument }
  | { type: "REMOVE"; id: string };

export function requiredDocumentsReducer(
  state: RequiredDocumentsState,
  action: RequiredDocumentsAction,
): RequiredDocumentsState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: state.status === "loaded" ? "loaded" : "loading", error: null };
    case "FETCH_SUCCESS":
      return { ...state, list: action.documents, status: "loaded", error: null };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    case "UPSERT": {
      const exists = state.list.some((d) => d.id === action.document.id);
      const list = exists
        ? state.list.map((d) => (d.id === action.document.id ? action.document : d))
        : [...state.list, action.document];
      return { ...state, list };
    }
    case "REMOVE":
      return { ...state, list: state.list.filter((d) => d.id !== action.id) };
    default:
      return state;
  }
}
