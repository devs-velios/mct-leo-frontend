"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import AnalyticsCards from "@/components/AnalyticsCards";
import Charts from "@/components/Charts";
import Table from "@/components/Table";
import NewDossierModal from "@/components/dashboard/NewDossierModal";
import { useDashboard } from "./layout";

export default function DashboardPage() {
  const {
    setSelectedDossierId,
    setMobileMenuOpen,
    isNewDossierModalOpen,
    setIsNewDossierModalOpen,
    dossiersList,
    setDossiersList
  } = useDashboard();

  const [selectedFilter, setSelectedFilter] = useState("tous");

  const handleCreateDossier = (newDossier: any) => {
    setDossiersList([newDossier, ...dossiersList]);
  };

  const filteredDossiers = dossiersList.filter((d) => {
    if (selectedFilter === "tous") return true;
    if (selectedFilter === "critiques") return d.joursInactif >= 5;
    if (selectedFilter === "onboarding") return d.phase === "Onboarding";
    if (selectedFilter === "agrement") return d.phase === "Dépôt Agrément";
    return true;
  });

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
          {/* 1. Analytics KPI Grid */}
          <AnalyticsCards />

          {/* 2. Analytics & Insights Section */}
          <Charts onOpenDossier={setSelectedDossierId} />

          {/* 3. Bottom: full-width alerts table, with the live activity stream below it */}
          <div className="space-y-4 lg:space-y-5 xl:space-y-6 w-full min-w-0">
            {/* Alerts Table — full width */}
            <div className="w-full min-w-0">
              <Table
                filteredDossiers={filteredDossiers}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                dossiersList={dossiersList}
                onOpenDossier={setSelectedDossierId}
              />
            </div>

          </div>
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
