"use client";

import { useEffect, useState } from "react";
import { Menu, AlertTriangle, Check, ShieldCheck, Info, ChevronRight } from "lucide-react";
import { useAlertsContext } from "@/lib/features/alerts";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { ResponsiveTabs } from "@/components/ui/responsive-tabs";

interface AlertsViewProps {
  setMobileMenuOpen?: (open: boolean) => void;
  onOpenDossier?: (id: string) => void;
}

export default function AlertsView({ setMobileMenuOpen, onOpenDossier }: AlertsViewProps) {
  const { alerts, isLoading: loading, ensureLoaded, refresh, resolve: resolveAlert } = useAlertsContext();
  const [tab, setTab] = useState<"open" | "resolved">("open");

  // Cache-guarded: fetches each filter once, reuses across navigations.
  useEffect(() => { ensureLoaded({ status: tab }); }, [tab, ensureLoaded]);

  const resolve = async (id: string) => {
    try {
      await resolveAlert(id); // context removes it from the list optimistically
    } catch {
      refresh({ status: tab });
    }
  };

  return (
    <>
      <header className="border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur lg:px-6">
        <div className="mb-3 flex items-center justify-between md:hidden">
          <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
          <button onClick={() => setMobileMenuOpen?.(true)} className="rounded-lg p-2 text-[#332151] hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div>
          <h1 className="font-serif-mct text-base sm:text-xl font-bold text-[#332151]">Alertes</h1>
          <p className="text-xs text-[#5A5A7A]">Blocages signalés nécessitant une intervention</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/30">
        <div className="mx-auto max-w-3xl mb-6">
          <ResponsiveTabs
            value={tab}
            onValueChange={(v) => setTab(v as "open" | "resolved")}
            className="w-full sm:w-auto"
            options={[
              { value: "open", label: "Ouvertes" },
              { value: "resolved", label: "Résolues" },
            ]}
          />
        </div>

        {loading ? (
          <SkeletonCards count={4} className="mx-auto max-w-3xl" />
        ) : alerts.length === 0 ? (
          <div className="mx-auto max-w-md text-center py-12 px-4">
            <div className="relative mb-6 inline-flex items-center justify-center">
              {/* Outer glowing pulse ring */}
              <div
                className={`absolute inset-0 rounded-full blur-xl opacity-35 animate-pulse ${
                  tab === "open" ? "bg-emerald-400" : "bg-[#E34F2D]/35"
                }`}
              />
              {/* Inner container */}
              <div
                className={`relative flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 shadow-sm ${
                  tab === "open" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50/50 text-[#E34F2D]"
                }`}
              >
                {tab === "open" ? <ShieldCheck className="h-8 w-8" /> : <Info className="h-8 w-8" />}
              </div>
            </div>

            <h3 className="font-serif-mct text-lg font-bold text-[#332151]">
              {tab === "open" ? "Aucune alerte ouverte" : "Aucune alerte résolue"}
            </h3>
            <p className="mt-2 text-xs text-[#5A5A7A] leading-relaxed max-w-xs mx-auto">
              {tab === "open"
                ? "Excellent ! Aucun incident ou blocage n'a été signalé sur vos centres pour le moment."
                : "L'historique des alertes résolues est vide."}
            </p>

            {/* Nice card/div below the empty state statement */}
            <div className="group mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-[#E34F2D]/20 hover:shadow-[0_20px_45px_rgba(234,91,45,0.08)] transition-all duration-200 text-left relative">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Surveillance active</span>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  En direct
                </span>
              </div>
              <p className="text-[11px] text-[#5A5A7A] leading-relaxed">
                Le système MCT surveille en permanence vos flux. Si un blocage bloquant nécessite votre intervention,
                une alerte apparaîtra ici et vous serez averti immédiatement.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="group relative overflow-hidden flex items-start gap-4 rounded-3xl border border-slate-100/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.005)] hover:border-[#E34F2D]/20 hover:shadow-[0_12px_35px_rgba(45,42,86,0.04)] transition-all duration-200"
              >
                {/* Decorative status indicator line */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    a.status === "open" ? "bg-red-500" : "bg-emerald-500"
                  }`}
                />
                
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl pl-1 ${
                    a.status === "open" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
                  }`}
                >
                  {a.status === "open" ? <AlertTriangle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                      {a.type}
                    </span>
                    <span className="text-[11px] text-slate-400">{new Date(a.created_at).toLocaleString("fr-FR")}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-[#1A1A1A] leading-relaxed">{a.message}</p>
                  <button
                    onClick={() => onOpenDossier?.(a.centre_id)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#E34F2D]/10 px-3 py-1.5 text-xs font-bold text-[#E34F2D] transition-colors hover:bg-[#E34F2D] hover:text-white cursor-pointer"
                  >
                    Voir le centre <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                {a.status === "open" && (
                  <button
                    onClick={() => resolve(a.id)}
                    className="shrink-0 rounded-xl bg-[#332151] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#3a3670] hover:shadow-[0_4px_12px_rgba(45,42,86,0.15)] active:scale-95 cursor-pointer"
                  >
                    Résoudre
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
