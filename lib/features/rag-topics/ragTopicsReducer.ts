// RAG topics feature — reducer.

import { type RagTopicsState, type RagTopic } from "./types";

export const initialRagTopicsState: RagTopicsState = {
  list: [],
  status: "idle",
  error: null,
};

export type RagTopicsAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; topics: RagTopic[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "UPSERT"; topic: RagTopic }
  | { type: "REMOVE"; section: string };

export function ragTopicsReducer(state: RagTopicsState, action: RagTopicsAction): RagTopicsState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: state.status === "loaded" ? "loaded" : "loading", error: null };
    case "FETCH_SUCCESS":
      return { ...state, list: action.topics, status: "loaded", error: null };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    case "UPSERT": {
      const exists = state.list.some((t) => t.section === action.topic.section);
      const list = exists
        ? state.list.map((t) => (t.section === action.topic.section ? action.topic : t))
        : [...state.list, action.topic];
      return { ...state, list };
    }
    case "REMOVE":
      return { ...state, list: state.list.filter((t) => t.section !== action.section) };
    default:
      return state;
  }
}
