// Departments feature — shared types. Mirrors /api/departments. The managed
// reference list of French départements used by the interveners "sectors" picker
// (a sector = a département code an intervener covers).

export interface Department {
  code: string; // e.g. "13", "2A", "75"
  name: string; // e.g. "Bouches-du-Rhône"
}

export interface DepartmentsListResponse {
  departments: Department[];
}

export interface CreateDepartmentPayload {
  code: string;
  name: string;
}

export interface UpdateDepartmentPayload {
  name: string;
}

export interface DepartmentsState {
  list: Department[];
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
}
