// Auth feature — backend identity (role) lookup via the Léo proxy.

import { api } from "@/lib/api";

export interface Me {
  id: string;
  email: string;
  role: "operateur" | "direction" | null;
}

export async function fetchMe(): Promise<Me> {
  return api.get<Me>("auth/me");
}
