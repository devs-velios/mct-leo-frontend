// Audit log feature — public hook. Server-side paginated (limit/offset), read-only.

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { fetchAuditLog } from "./api";
import { type AuditLogEntry, type AuditStatus } from "./types";

export function useAudit(pageSize = 20) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AuditStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const loadedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadPage = useCallback(async (p: number) => {
    setStatus("loading");
    setError(null);
    try {
      const { entries, count } = await fetchAuditLog({ limit: pageSize, offset: (p - 1) * pageSize });
      if (!mountedRef.current) return;
      setEntries(entries);
      setCount(count);
      setPage(p);
      setStatus("loaded");
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Échec du chargement du journal d'audit");
      setStatus("error");
    }
  }, [pageSize]);

  // Fetch the first page once on first use.
  const ensureLoaded = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void loadPage(1);
  }, [loadPage]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return {
    entries,
    count,
    page,
    pageSize,
    totalPages,
    status,
    error,
    isLoading: status === "loading" || status === "idle",
    ensureLoaded,
    goToPage: loadPage,
    refresh: () => loadPage(page),
  };
}
