// Direction heat-map feature — network layer (read-only).

import { api } from "@/lib/api";
import { type PipelineHeatmap, type HeatmapQuery } from "./types";

/** GET /api/dashboard/pipeline-heatmap?orange_days=&red_days= (params optional). */
export async function fetchPipelineHeatmap(q: HeatmapQuery = {}): Promise<PipelineHeatmap> {
  const params = new URLSearchParams();
  if (q.orange_days != null) params.set("orange_days", String(q.orange_days));
  if (q.red_days != null) params.set("red_days", String(q.red_days));
  const qs = params.toString();
  return api.get<PipelineHeatmap>(`dashboard/pipeline-heatmap${qs ? `?${qs}` : ""}`);
}
