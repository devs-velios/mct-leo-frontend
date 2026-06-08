// Users feature — network layer.

import { api } from "@/lib/api";
import { type InviteUserPayload, type InviteResult } from "./types";

export async function inviteUser(payload: InviteUserPayload): Promise<InviteResult> {
  return api.post<InviteResult>("admin/users", payload);
}
