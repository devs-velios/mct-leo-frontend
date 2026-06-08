// Folders feature — state reducer.

import { type FoldersState, type Folder, type RoutingEntry } from "./types";

export type FoldersAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; folders: Folder[]; routing: RoutingEntry[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "FOLDER_ADDED"; folder: Folder }
  | { type: "FOLDER_UPDATED"; folder: Folder }
  | { type: "ROUTING_UPDATED"; doc_key: string; folder_name: string };

export const initialFoldersState: FoldersState = {
  folders: [],
  routing: [],
  status: "idle",
  error: null,
};

export function foldersReducer(state: FoldersState, action: FoldersAction): FoldersState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: "loading", error: null };
    case "FETCH_SUCCESS":
      return { ...state, folders: action.folders, routing: action.routing, status: "loaded", error: null };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    case "FOLDER_ADDED":
      return { ...state, folders: [...state.folders, action.folder] };
    case "FOLDER_UPDATED":
      return { ...state, folders: state.folders.map((f) => (f.id === action.folder.id ? action.folder : f)) };
    case "ROUTING_UPDATED":
      return {
        ...state,
        routing: state.routing.map((r) => (r.doc_key === action.doc_key ? { ...r, folder_name: action.folder_name } : r)),
      };
    default:
      return state;
  }
}
