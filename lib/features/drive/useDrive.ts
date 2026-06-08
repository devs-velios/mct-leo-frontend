// Drive feature — public hook. Browse folders/files with a per-path cache so
// revisiting a directory is instant.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { driveReducer, initialDriveState } from "./driveReducer";
import { fetchDriveFolders, fetchDriveFiles } from "./api";

export function useDrive() {
  const [state, dispatch] = useReducer(driveReducer, initialDriveState);
  const mountedRef = useRef(true);
  const statusRef = useRef(state.statusByPath);
  statusRef.current = state.statusByPath;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load a directory; cached per path unless force=true.
  const browse = useCallback(async (path: string, force = false) => {
    const status = statusRef.current[path];
    if (!force && (status === "loaded" || status === "loading")) return;
    dispatch({ type: "LOAD_START", path });
    try {
      const [f, fi] = await Promise.all([fetchDriveFolders(path), fetchDriveFiles(path)]);
      if (mountedRef.current) dispatch({ type: "LOAD_SUCCESS", path, folders: f.folders, files: fi.files });
    } catch {
      if (mountedRef.current) dispatch({ type: "LOAD_ERROR", path });
    }
  }, []);

  return {
    byPath: state.byPath,
    statusByPath: state.statusByPath,
    browse,
  };
}
