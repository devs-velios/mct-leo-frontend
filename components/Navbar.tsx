"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationPopover, type Notification } from "@/components/ui/notification-popover";
import { useAlertsContext, openAlerts as selectOpenAlerts, alertsToNotifications } from "@/lib/features/alerts";

interface NavbarProps {
  setMobileMenuOpen: (open: boolean) => void;
  setIsNewDossierModalOpen?: (open: boolean) => void;
  onOpenDossier?: (centreId: string) => void;
}

export default function Navbar({ setMobileMenuOpen, onOpenDossier }: NavbarProps) {
  const router = useRouter();
  const { alerts, ensureLoaded } = useAlertsContext();

  useEffect(() => { ensureLoaded({ status: "open" }); }, [ensureLoaded]);

  // Real current date in French (set after mount to avoid hydration mismatch).
  const [today, setToday] = useState("");
  useEffect(() => {
    const d = new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setToday(d.charAt(0).toUpperCase() + d.slice(1));
  }, []);

  // Open alerts → notifications; locally "read" so the badge can be cleared.
  const openAlerts = useMemo(() => selectOpenAlerts(alerts), [alerts]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const notifications: Notification[] = alertsToNotifications(alerts, readIds);

  const handleSelect = (id: string) => {
    const alert = openAlerts.find((a) => a.id === id);
    if (alert?.centre_id) onOpenDossier?.(alert.centre_id);
  };

  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 className="font-serif-mct text-xl sm:text-2xl font-bold tracking-tight text-[#332151]">Dashboard</h2>
        {today && <p className="truncate text-xs text-[#5A5A7A]">{today}</p>}
      </div>

      <div className="flex items-center gap-2">
        <NotificationPopover
          notifications={notifications}
          onSelect={handleSelect}
          onMarkAllAsRead={() => setReadIds(new Set(openAlerts.map((a) => a.id)))}
          emptyLabel="Aucune alerte active 🎉"
        />
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/simulateur")}
          className="hidden gap-1.5 text-xs font-bold text-[#332151] sm:inline-flex"
        >
          Lancer onboarding
        </Button>
        <Button onClick={() => router.push("/dashboard/simulateur")} className="gap-1.5 text-xs font-bold">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nouveau dossier</span>
        </Button>
        {/* Hamburger — right side, mobile only */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-lg p-2 text-[#332151] hover:bg-slate-100 md:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
