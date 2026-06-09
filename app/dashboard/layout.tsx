"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/features/auth/useAuth";
import { AppProviders } from "@/lib/features/AppProviders";
import { useCentresContext } from "@/lib/features/centres";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { type DashboardDossier, centreToDossier } from "@/components/dashboard/dashboardData";

interface DashboardContextType {
  // Opens a centre's dossier detail page (resolves the centre's dossier id → routes there).
  setSelectedDossierId: (centreId: string | null) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isNewDossierModalOpen: boolean;
  setIsNewDossierModalOpen: (open: boolean) => void;
  dossiersList: DashboardDossier[];
  setDossiersList: React.Dispatch<React.SetStateAction<DashboardDossier[]>>;
  activeTab: string;
  // Which sub-view of the (merged) Drive page is showing — drives the sidebar submenu too.
  driveTab: "explorer" | "config";
  setDriveTab: (tab: "explorer" | "config") => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { centres, ensureList } = useCentresContext();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dossiersList, setDossiersList] = useState<DashboardDossier[]>([]);
  const [driveTab, setDriveTab] = useState<"explorer" | "config">("explorer");

  // Cache-guarded centres load via the shared provider; derive the dashboard rows.
  // The list now returns last_activity_at (most recent message) → real "jours inactif".
  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);
  useEffect(() => {
    setDossiersList(centres.map((c) => centreToDossier({ ...c, last_activity_at: c.last_activity_at ?? null })));
  }, [centres]);

  const [isNewDossierModalOpen, setIsNewDossierModalOpen] = useState(false);

  // Clicking a centre opens its CENTER PROFILE (centre-scoped detail), not a file.
  // The profile route is keyed directly by the centre id.
  const setSelectedDossierId = useCallback((centreId: string | null) => {
    if (!centreId) return;
    router.push(`/dashboard/centres/${centreId}`);
  }, [router]);

  // Route protection is handled by the middleware (proxy.ts), which redirects
  // unauthenticated /dashboard requests to "/". We intentionally do NOT redirect on the
  // client here: on a hard refresh the session restore is async, so `user` is briefly null
  // and a client redirect would bounce a logged-in user to the login page (→ dashboard).
  const userEmail = user?.email || "chargement...";

  // Determine activeTab based on pathname
  let activeTab = "Dashboard";
  if (pathname.includes("/centres")) activeTab = "Centres";
  else if (pathname.includes("/validations")) activeTab = "Validations";
  else if (pathname.includes("/dossiers")) activeTab = "Dossiers";
  else if (pathname.includes("/carte")) activeTab = "Carte";
  else if (pathname.includes("/conversations")) activeTab = "Conversations";
  else if (pathname.includes("/alertes")) activeTab = "Alertes";
  else if (pathname.includes("/rappels")) activeTab = "Rappels";
  else if (pathname.includes("/assistant")) activeTab = "Assistant";
  else if (pathname.includes("/drive-config")) activeTab = "Dossiers Drive";
  else if (pathname.includes("/drive")) activeTab = "Drive";
  else if (pathname.includes("/utilisateurs")) activeTab = "Utilisateurs";
  else if (pathname.includes("/simulateur")) activeTab = "Simulateur";
  else if (pathname.includes("/fonctionnement")) activeTab = "Fonctionnement";

  const handleLogout = () => {
    logout();
  };

  const handleTabChange = (tab: string) => {
    if (tab === "Dashboard") router.push("/dashboard");
    else if (tab === "Centres") router.push("/dashboard/centres");
    else if (tab === "Validations") router.push("/dashboard/validations");
    else if (tab === "Dossiers") router.push("/dashboard/dossiers");
    else if (tab === "Carte") router.push("/dashboard/carte");
    else if (tab === "Conversations") router.push("/dashboard/conversations");
    else if (tab === "Alertes") router.push("/dashboard/alertes");
    else if (tab === "Rappels") router.push("/dashboard/rappels");
    else if (tab === "Assistant") router.push("/dashboard/assistant");
    else if (tab === "Drive") { setDriveTab("explorer"); router.push("/dashboard/drive"); }
    else if (tab === "Dossiers Drive") { setDriveTab("config"); router.push("/dashboard/drive"); }
    else if (tab === "Utilisateurs") router.push("/dashboard/utilisateurs");
    else if (tab === "Simulateur") router.push("/dashboard/simulateur");
    else if (tab === "Fonctionnement") router.push("/dashboard/fonctionnement");
  };

  return (
    <DashboardContext.Provider
      value={{
        setSelectedDossierId,
        mobileMenuOpen,
        setMobileMenuOpen,
        isNewDossierModalOpen,
        setIsNewDossierModalOpen,
        dossiersList,
        setDossiersList,
        activeTab,
        driveTab,
        setDriveTab
      }}
    >
      <SidebarProvider
        openMobile={mobileMenuOpen}
        onOpenMobileChange={setMobileMenuOpen}
        className="h-svh overflow-hidden bg-[#F5F5F7]"
      >
        <AppSidebar
          activeTab={activeTab}
          driveTab={driveTab}
          onNavigate={handleTabChange}
          userEmail={userEmail}
          onLogout={handleLogout}
        />
        <SidebarInset className="h-svh min-h-0 overflow-hidden bg-[#F5F5F7]">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </DashboardContext.Provider>
  );
}

// Mount all feature cache providers once, above the shell, so every dashboard page
// shares one cached store (see AppProviders).
export default function RootDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <DashboardShell>{children}</DashboardShell>
    </AppProviders>
  );
}
