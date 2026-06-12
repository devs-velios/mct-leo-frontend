// Departments feature — network layer.

import { api } from "@/lib/api";
import {
  type Department,
  type DepartmentsListResponse,
  type CreateDepartmentPayload,
  type UpdateDepartmentPayload,
} from "./types";

export async function fetchDepartments(): Promise<DepartmentsListResponse> {
  return api.get<DepartmentsListResponse>("departments");
}

export async function createDepartment(payload: CreateDepartmentPayload): Promise<Department> {
  return api.post<Department>("departments", payload);
}

export async function updateDepartment(code: string, payload: UpdateDepartmentPayload): Promise<Department> {
  return api.patch<Department>(`departments/${encodeURIComponent(code)}`, payload);
}

export async function deleteDepartment(code: string): Promise<{ deleted: boolean; code: string }> {
  return api.del<{ deleted: boolean; code: string }>(`departments/${encodeURIComponent(code)}`);
}
