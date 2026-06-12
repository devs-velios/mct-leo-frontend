"use client";

import Navbar from "@/components/layout/Navbar";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
import Charts from "@/components/dashboard/Charts";
import NewDossierModal from "@/components/dashboard/NewDossierModal";
import { useDashboard } from "./layout";

export default function DashboardPage() {
  const {
    setSelectedDossierId,
    setMobileMenuOpen,
    isNewDossierModalOpen,
    setIsNewDossierModalOpen,
    dossiersList,
    setDossiersList,
  } = useDashboard();

  const handleCreateDossier = (newDossier: any) => {
    setDossiersList([newDossier, ...dossiersList]);
  };

  return (
    <>
      {/* Navbar header section */}
      <Navbar
        setMobileMenuOpen={setMobileMenuOpen}
        setIsNewDossierModalOpen={setIsNewDossierModalOpen}
        onOpenDossier={setSelectedDossierId}
      />

      {/* Main dashboard content container */}
      <div className="flex-1 p-4 lg:p-5 xl:p-6 space-y-4 lg:space-y-5 xl:space-y-6 overflow-y-auto overflow-x-clip w-full min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* 1. KPI grid */}
          <AnalyticsCards />

          {/* 2. Charts + action tables */}
          <Charts onOpenDossier={setSelectedDossierId} />
        </div>
      </div>

      {/* Modal: Simulate New Onboarding Dossier */}
      <NewDossierModal
        isOpen={isNewDossierModalOpen}
        onClose={() => setIsNewDossierModalOpen(false)}
        onCreate={handleCreateDossier}
      />
    </>
  );
}
