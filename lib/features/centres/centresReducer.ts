// Centres feature — state reducer.

import {
  type CentresState,
  type CentreListItem,
  type CentreDetail,
} from "./types";

export type CentresAction =
  | { type: "LIST_START" }
  | { type: "LIST_SUCCESS"; centres: CentreListItem[]; count: number }
  | { type: "LIST_ERROR"; error: string }
  | { type: "DETAIL_START" }
  | { type: "DETAIL_SUCCESS"; detail: CentreDetail }
  | { type: "DETAIL_ERROR"; error: string }
  | { type: "CLEAR_DETAIL" }
  | { type: "DELETE_SUCCESS"; id: string }
  | { type: "UPDATE_LIST_ITEM"; id: string; updates: Partial<CentreListItem> };

export const initialCentresState: CentresState = {
  list: [],
  count: 0,
  detail: null,
  listStatus: "idle",
  detailStatus: "idle",
  error: null,
};

export function centresReducer(state: CentresState, action: CentresAction): CentresState {
  switch (action.type) {
    case "LIST_START":
      return { ...state, listStatus: "loading", error: null };
    case "LIST_SUCCESS":
      return { ...state, list: action.centres, count: action.count, listStatus: "loaded", error: null };
    case "LIST_ERROR":
      return { ...state, listStatus: "error", error: action.error };
    case "DETAIL_START":
      return { ...state, detailStatus: "loading", error: null };
    case "DETAIL_SUCCESS":
      return { ...state, detail: action.detail, detailStatus: "loaded", error: null };
    case "DETAIL_ERROR":
      return { ...state, detailStatus: "error", error: action.error };
    case "CLEAR_DETAIL":
      return { ...state, detail: null, detailStatus: "idle" };
    case "DELETE_SUCCESS":
      return {
        ...state,
        list: state.list.filter((c) => c.id !== action.id),
        count: state.count - 1,
        detail: state.detail?.centre.id === action.id ? null : state.detail,
      };
    case "UPDATE_LIST_ITEM":
      return {
        ...state,
        list: state.list.map((c) => (c.id === action.id ? { ...c, ...action.updates } : c)),
      };
    default:
      return state;
  }
}
