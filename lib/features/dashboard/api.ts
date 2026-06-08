// Dashboard feature — network layer.

import { api } from "@/lib/api";
import { type DashboardStats } from "./types";

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return api.get<DashboardStats>("dashboard");
}
