// Dossiers feature — state reducer.

import { type DossiersState, type DossierListItem } from "./types";

export type DossiersAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; dossiers: DossierListItem[]; count: number }
  | { type: "FETCH_ERROR"; error: string };

export const initialDossiersState: DossiersState = {
  list: [],
  count: 0,
  status: "idle",
  error: null,
};

export function dossiersReducer(state: DossiersState, action: DossiersAction): DossiersState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: "loading", error: null };
    case "FETCH_SUCCESS":
      return { ...state, list: action.dossiers, count: action.count, status: "loaded", error: null };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    default:
      return state;
  }
}
