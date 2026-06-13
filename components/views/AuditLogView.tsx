"use client";

import { useEffect } from "react";
import { Menu, RefreshCw, ScrollText } from "lucide-react";
import { useAudit, type AuditLogEntry } from "@/lib/features/audit";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { DataTable } from "@/components/ui/data-table";

// Soft tone per actor type (calm tints, not solid fills).
const ACTOR_TONE: Record<string, string> = {
  operateur: "bg-indigo-50 text-[#332151]",
  client: "bg-amber-50 text-amber-700",
  leo: "bg-[#E34F2D]/10 text-[#E34F2D]",
  system: "bg-slate-100 text-slate-600",
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const shortId = (id?: string | null) => (id ? `${id.slice(0, 8)}…` : "—");

export default function AuditLogView({ setMobileMenuOpen }: { setMobileMenuOpen?: (o: boolean) => void }) {
  const { entries, count, page, totalPages, isLoading, status, error, ensureLoaded, goToPage, refresh } = useAudit(20);

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#F5F5F7]">
      <header className="flex flex-col gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between md:hidden">
            <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
            <button onClick={() => setMobileMenuOpen?.(true)} className="rounded-lg p-2 text-[#332151] hover:bg-slate-100" aria-label="Ouvrir le menu">
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <h2 className="font-serif-mct text-lg sm:text-2xl font-bold tracking-tight text-[#332151]">Journal d'audit</h2>
          <p className="mt-0.5 text-xs text-[#5A5A7A]">{`Historique des actions sur les entités — ${count} entrée${count > 1 ? "s" : ""}.`}</p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#332151] transition-colors hover:bg-slate-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Actualiser
        </button>
      </header>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 custom-scrollbar">
        <div className="mx-auto w-full min-w-0 max-w-[1400px]">
          {isLoading && entries.length === 0 ? (
            <SkeletonTable rows={10} cols={5} />
          ) : status === "error" ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-xs font-semibold text-rose-600">{error}</div>
          ) : (
            <div className="rounded-3xl border border-slate-100/80 bg-white p-4 shadow-sm sm:p-5">
              <DataTable<AuditLogEntry>
                data={entries}
                getRowId={(e) => e.id}
                minWidth="860px"
                hideToolbar
                bare
                emptyMessage="Aucune entrée dans le journal."
                pagination={{ page, totalPages, totalItems: count, numbered: true, onPageChange: goToPage }}
                columns={[
                  {
                    id: "created_at",
                    header: "Date",
                    width: "170px",
                    cell: (e) => <span className="whitespace-nowrap text-xs font-semibold text-[#332151] tabular-nums">{fmtDateTime(e.created_at)}</span>,
                  },
                  {
                    id: "action",
                    header: "Action",
                    width: "minmax(160px,1.4fr)",
                    cell: (e) => (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#332151]">
                        {e.action}
                      </span>
                    ),
                  },
                  {
                    id: "entity",
                    header: "Entité",
                    width: "minmax(150px,1fr)",
                    cell: (e) => (
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#332151]">{e.entity_type}</p>
                        <p className="truncate font-mono text-[10px] text-slate-400" title={e.entity_id}>{shortId(e.entity_id)}</p>
                      </div>
                    ),
                  },
                  {
                    id: "actor",
                    header: "Acteur",
                    width: "minmax(140px,1fr)",
                    cell: (e) => (
                      <div className="min-w-0">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${ACTOR_TONE[e.actor_type] ?? "bg-slate-100 text-slate-600"}`}>
                          {e.actor_type}
                        </span>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400" title={e.actor_id ?? undefined}>{shortId(e.actor_id)}</p>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
