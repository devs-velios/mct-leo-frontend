"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAlertsContext, openAlerts as selectOpenAlerts } from "@/lib/features/alerts";

interface AlertsBellProps {
  onOpenDossier?: (centreId: string) => void;
}

/**
 * Global open-alerts indicator for the dashboard navbar. Shows the open count and a dropdown
 * that deep-links each alert to its centre's dossier hub (where it can be resolved).
 */
export default function AlertsBell({ onOpenDossier }: AlertsBellProps) {
  const { alerts, ensureLoaded } = useAlertsContext();
  const [open, setOpen] = useState(false);

  useEffect(() => { ensureLoaded({ status: "open" }); }, [ensureLoaded]);

  const openAlerts = selectOpenAlerts(alerts);
  const count = openAlerts.length;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".alerts-bell")) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  return (
    <div className="alerts-bell relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title={`${count} alerte${count > 1 ? "s" : ""} active${count > 1 ? "s" : ""}`}
        className={`relative flex items-center justify-center h-10 w-10 rounded-lg border transition-colors cursor-pointer ${
          count > 0
            ? "border-[#E34F2D]/30 bg-[#E34F2D]/10 text-[#E34F2D] hover:bg-[#E34F2D]/15"
            : "border-slate-200 bg-white text-[#332151] hover:bg-slate-50"
        }`}
      >
        <Bell className="h-4.5 w-4.5" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E34F2D] px-1 text-[8px] font-extrabold text-white ring-2 ring-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white text-[#332151] border border-slate-100 rounded-2xl shadow-2xl p-2 z-50">
          <div className="px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            {count} alerte{count > 1 ? "s" : ""} active{count > 1 ? "s" : ""}
          </div>
          {openAlerts.map((a) => (
            <button
              key={a.id}
              onClick={() => { setOpen(false); onOpenDossier?.(a.centre_id); }}
              className="w-full text-left px-3 py-2.5 rounded-xl mb-0.5 last:mb-0 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className="block text-[8.5px] font-extrabold uppercase tracking-wider text-red-500 mb-1">
                {a.type}{a.code_centre ? ` · ${a.code_centre}` : ""}
              </span>
              <span className="block text-[11px] font-semibold leading-snug line-clamp-2">{a.message}</span>
            </button>
          ))}
          {count === 0 && (
            <p className="px-3 py-4 text-center text-[11px] font-semibold italic text-slate-400">
              Aucune alerte active 🎉
            </p>
          )}
        </div>
      )}
    </div>
  );
}
