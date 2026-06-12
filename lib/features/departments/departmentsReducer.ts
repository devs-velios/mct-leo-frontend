// Departments feature — reducer.

import { type DepartmentsState, type Department } from "./types";

export const initialDepartmentsState: DepartmentsState = {
  list: [],
  status: "idle",
  error: null,
};

export type DepartmentsAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; departments: Department[] }
  | { type: "FETCH_ERROR"; error: string }
  | { type: "UPSERT"; department: Department }
  | { type: "REMOVE"; code: string };

export function departmentsReducer(state: DepartmentsState, action: DepartmentsAction): DepartmentsState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, status: state.status === "loaded" ? "loaded" : "loading", error: null };
    case "FETCH_SUCCESS":
      return { ...state, list: action.departments, status: "loaded", error: null };
    case "FETCH_ERROR":
      return { ...state, status: "error", error: action.error };
    case "UPSERT": {
      const exists = state.list.some((d) => d.code === action.department.code);
      const list = exists
        ? state.list.map((d) => (d.code === action.department.code ? action.department : d))
        : [...state.list, action.department];
      return { ...state, list };
    }
    case "REMOVE":
      return { ...state, list: state.list.filter((d) => d.code !== action.code) };
    default:
      return state;
  }
}
