"use client";

import { HardDrive, FolderTree } from "lucide-react";
import DriveView from "@/components/DriveView";
import FoldersView from "@/components/FoldersView";
import { useDashboard } from "../layout";

// Drive is now a single page with two tabs: the read-only file explorer and the
// folder/routing configuration (formerly the separate "Dossiers Drive" page).
const TABS = [
  { key: "explorer", label: "Explorateur", icon: HardDrive },
  { key: "config", label: "Dossiers & Routage", icon: FolderTree },
] as const;

export default function DrivePage() {
  // Tab is held in the dashboard context so the sidebar's Drive submenu and the
  // in-page tabs stay in sync (both read/write the same state).
  const { setMobileMenuOpen, driveTab: tab, setDriveTab: setTab } = useDashboard();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F5F7]">
      {/* Tab switch */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-white px-4 lg:px-6 pt-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border-b-2 -mb-px ${
                active
                  ? "border-[#E34F2D] text-[#E34F2D]"
                  : "border-transparent text-[#5A5A7A] hover:text-[#332151] hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active tab content */}
      <div className="flex-1 flex flex-col min-h-0">
        {tab === "explorer" ? (
          <DriveView setMobileMenuOpen={setMobileMenuOpen} />
        ) : (
          <FoldersView setMobileMenuOpen={setMobileMenuOpen} />
        )}
      </div>
    </div>
  );
}
