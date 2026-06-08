// Drive feature — state reducer (per-path cache).

import { type DriveState, type DriveEntry } from "./types";

export type DriveAction =
  | { type: "LOAD_START"; path: string }
  | { type: "LOAD_SUCCESS"; path: string; folders: DriveEntry[]; files: DriveEntry[] }
  | { type: "LOAD_ERROR"; path: string };

export const initialDriveState: DriveState = {
  byPath: {},
  statusByPath: {},
};

export function driveReducer(state: DriveState, action: DriveAction): DriveState {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, statusByPath: { ...state.statusByPath, [action.path]: "loading" } };
    case "LOAD_SUCCESS":
      return {
        ...state,
        byPath: { ...state.byPath, [action.path]: { folders: action.folders, files: action.files } },
        statusByPath: { ...state.statusByPath, [action.path]: "loaded" },
      };
    case "LOAD_ERROR":
      return { ...state, statusByPath: { ...state.statusByPath, [action.path]: "error" } };
    default:
      return state;
  }
}
