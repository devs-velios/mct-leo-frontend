"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Folder,
  Map,
  Bell,
  Sparkles,
  HardDrive,
  Users,
  Zap,
  Settings,
  X,
  LogOut
} from "lucide-react";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail: string;
  handleLogout: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function DashboardLayout({
  children,
  activeTab,
  setActiveTab,
  userEmail,
  handleLogout,
  mobileMenuOpen,
  setMobileMenuOpen
}: DashboardLayoutProps) {
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Centres", icon: Building2 },
    { name: "Dossiers", icon: Folder },
    { name: "Validations", icon: CheckSquare },
    { name: "Carte", icon: Map },
    { name: "Rappels", icon: Bell },
    { name: "Assistant", icon: Sparkles },
    { name: "Drive", icon: HardDrive },
    { name: "Utilisateurs", icon: Users },
    { name: "Simulateur", icon: Zap },
    { name: "Fonctionnement", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#F5F5F7] text-[#1A1A1A] overflow-hidden font-sans">
      
      {/* 1. Sidebar (Desktop) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userEmail={userEmail}
        handleLogout={handleLogout}
      />

      {/* 2. Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            {/* Drawer */}
            <motion.aside
              key="mobile-menu-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0.15 }}
              className="fixed inset-y-0 left-0 w-80 bg-[#2D2A56] text-[#F5F0E8] z-50 p-6 flex flex-col justify-between shadow-2xl lg:hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow-md">
                      <img src="/foxy.svg" alt="Léo" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold font-serif-mct text-[#F5F0E8]">MCT Léo</h1>
                      <p className="text-[9px] text-[#EA5B2D] uppercase tracking-wider font-bold">AI Onboarding</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-[#F5F0E8]/5 hover:bg-[#F5F0E8]/10 text-[#F5F0E8]/80 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          setActiveTab(item.name);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "text-[#EA5B2D] bg-white/5 border-l-4 border-[#EA5B2D]"
                            : "text-[#F5F0E8]/70 hover:text-[#F5F0E8] hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4.5 w-4.5 ${isActive ? "text-[#EA5B2D]" : "text-[#F5F0E8]/60"}`} />
                          <span>{item.name}</span>
                        </div>

                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Operator Section */}
              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8.5 w-8.5 rounded-full bg-[#EA5B2D]/20 flex items-center justify-center font-bold text-xs text-[#EA5B2D]">
                      OP
                    </div>
                    <div className="text-left truncate max-w-[120px]">
                      <p className="text-xs font-bold text-[#F5F0E8] truncate">{userEmail}</p>
                      <p className="text-[9px] font-bold text-[#5A5A7A] tracking-wider uppercase">POWERED BY VELIOS AI</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-[#F5F0E8]/60 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Dashboard Scroll Panel */}
      <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden min-w-0">
        {/* Dynamic page children rendering */}
        {children}
      </div>

    </div>
  );
}
