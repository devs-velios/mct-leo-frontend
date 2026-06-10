// Pipeline catalog feature — reducer.

import { type PipelineState, type PipelineCatalog, DEFAULT_MACRO_OPTIONS } from "./types";

export const initialPipelineState: PipelineState = {
  phases: [],
  macroOptions: DEFAULT_MACRO_OPTIONS,
  status: "idle",
  error: null,
};

export type PipelineAction =
  | { type: "FETCH_START" }
  | { type: "SET_CATALOG"; catalog: PipelineCatalog }
  | { type: "FETCH_ERROR"; error: string };

export function pipelineReducer(state: PipelineState, action: PipelineAction): PipelineState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: state.status === "loaded" ? "loaded" : "loading", error: null };
    case "SET_CATALOG":
      return {
        ...state,
        phases: [...action.catalog.phases].sort((a, b) => a.order - b.order),
        // Keep the seeded set if the API didn't return one (fixed catalog).
        macroOptions: action.catalog.macro_options?.length ? action.catalog.macro_options : state.macroOptions,
        status: "loaded",
        error: null,
      };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    default:
      return state;
  }
}
