// Direction heat-map feature — reducer.

import { type HeatmapState, type PipelineHeatmap, type HeatmapThresholds, DEFAULT_HEATMAP_THRESHOLDS } from "./types";

export const initialHeatmapState: HeatmapState = {
  data: null,
  thresholds: DEFAULT_HEATMAP_THRESHOLDS,
  status: "idle",
  error: null,
};

export type HeatmapAction =
  | { type: "FETCH_START" }
  | { type: "SET_DATA"; data: PipelineHeatmap }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "SET_THRESHOLDS"; thresholds: HeatmapThresholds };

export function heatmapReducer(state: HeatmapState, action: HeatmapAction): HeatmapState {
  switch (action.type) {
    case "FETCH_START":
      // Keep showing the previous matrix while refetching (avoids a flash on threshold change).
      return { ...state, status: state.status === "loaded" ? "loaded" : "loading", error: null };
    case "SET_DATA":
      return {
        ...state,
        data: action.data,
        // Mirror the thresholds the backend actually applied.
        thresholds: action.data.thresholds ?? state.thresholds,
        status: "loaded",
        error: null,
      };
    case "SET_THRESHOLDS":
      return { ...state, thresholds: action.thresholds };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    default:
      return state;
  }
}
