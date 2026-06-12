// Departments feature — public hook. Lazy cache-guarded list + create/update/delete.
// Pre-seeded backend-side with all 101 French départements, so the picker works
// out of the box; the CRUD is only for the (optional) admin screen.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { departmentsReducer, initialDepartmentsState } from "./departmentsReducer";
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from "./api";
import { type CreateDepartmentPayload, type UpdateDepartmentPayload } from "./types";

export function useDepartments() {
  const [state, dispatch] = useReducer(departmentsReducer, initialDepartmentsState);
  const mountedRef = useRef(true);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const data = await fetchDepartments();
      if (mountedRef.current) dispatch({ type: "FETCH_SUCCESS", departments: data.departments ?? [] });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "FETCH_ERROR", error: err instanceof Error ? err.message : "Échec du chargement des départements" });
      }
    }
  }, []);

  const ensureLoaded = useCallback(async (force = false) => {
    if (!force && (statusRef.current === "loaded" || statusRef.current === "loading")) return;
    await refresh();
  }, [refresh]);

  const create = useCallback(async (payload: CreateDepartmentPayload) => {
    const department = await createDepartment(payload);
    if (mountedRef.current) dispatch({ type: "UPSERT", department });
    return department;
  }, []);

  const update = useCallback(async (code: string, payload: UpdateDepartmentPayload) => {
    const department = await updateDepartment(code, payload);
    if (mountedRef.current) dispatch({ type: "UPSERT", department });
    return department;
  }, []);

  const remove = useCallback(async (code: string) => {
    if (mountedRef.current) dispatch({ type: "REMOVE", code }); // optimistic
    try {
      return await deleteDepartment(code);
    } catch (err) {
      await refresh(); // reconcile on failure
      throw err;
    }
  }, [refresh]);

  return {
    departments: state.list,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading" || state.status === "idle",
    refresh,
    ensureLoaded,
    create,
    update,
    remove,
  };
}
