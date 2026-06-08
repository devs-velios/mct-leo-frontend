"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Folder,
  Map,
  Settings,
  Users,
  Sparkles,
  Bell,
  HardDrive,
  Zap,
  LogOut,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail: string;
  handleLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, userEmail, handleLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

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
    <aside
      className={`hidden lg:flex flex-col bg-[#2D2A56] text-[#F5F0E8] relative z-20 shrink-0 select-none transition-[width] duration-300 ease-in-out ${
        collapsed ? "lg:w-[78px] xl:w-[78px]" : "lg:w-60 xl:w-64"
      }`}
    >
      {/* Collapse / expand toggle — floats on the right border */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
        className="absolute top-7 -right-3 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#2D2A56] shadow-md ring-1 ring-black/5 hover:text-[#EA5B2D] transition-colors cursor-pointer"
      >
        {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Sidebar Logo */}
      <div
        className={`flex items-center gap-2.5 border-b border-white/5 ${
          collapsed ? "justify-center px-2 py-5" : "px-4 py-5 xl:px-6 xl:py-6"
        }`}
      >
        <div className="flex h-10 w-10 xl:h-11 xl:w-11 items-center justify-center rounded-xl bg-white text-[#F5F0E8] shadow-md shrink-0 p-1">
          <img src="/foxy.svg" alt="Léo" className="h-full w-full object-contain" />
        </div>
        {!collapsed && (
          <div className="truncate">
            <h1 className="text-lg xl:text-xl font-bold tracking-tight font-serif-mct text-[#F5F0E8] truncate">
              MCT Léo
            </h1>
            <p className="text-[9px] xl:text-[10px] text-[#EA5B2D] uppercase tracking-widest font-bold">
              AI Onboarding
            </p>
          </div>
        )}
      </div>

      {/* Sidebar Navigation */}
      <nav className={`flex-1 py-5 xl:py-6 space-y-1.5 overflow-y-auto no-scrollbar ${collapsed ? "px-2.5" : "px-2.5 xl:px-3"}`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              title={collapsed ? item.name : undefined}
              className={`w-full flex items-center rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 relative group overflow-hidden ${
                collapsed ? "justify-center h-11" : "justify-between px-3.5 py-2.5 xl:px-4 xl:py-3"
              } ${
                isActive
                  ? "text-[#EA5B2D]"
                  : "text-[#F5F0E8]/70 hover:text-[#F5F0E8] hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebarActiveBg"
                  className="absolute inset-0 bg-white/5 border-l-4 border-[#EA5B2D] z-0"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <div className={`flex items-center relative z-10 ${collapsed ? "" : "gap-3"}`}>
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-[#EA5B2D]" : "text-[#F5F0E8]/50 group-hover:text-[#F5F0E8]"}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Bottom Operator Status */}
      <div className={`bg-[#1E1D3B] ${collapsed ? "p-2" : "p-3 xl:p-4"}`}>
        <div
          className={`flex items-center rounded-xl bg-white/5 ${
            collapsed ? "flex-col gap-2 p-2" : "justify-between p-2.5 xl:p-3"
          }`}
        >
          <div className={`flex items-center truncate ${collapsed ? "" : "gap-2 xl:gap-2.5"}`}>
            <div className="relative shrink-0">
              <div className="h-8 w-8 xl:h-8.5 xl:w-8.5 rounded-full bg-[#EA5B2D]/20 flex items-center justify-center font-bold text-xs text-[#EA5B2D]">
                OP
              </div>
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#2D2A56]" />
            </div>
            {!collapsed && (
              <div className="text-left truncate max-w-[100px] xl:max-w-[130px]">
                <p className="text-[11px] xl:text-xs font-bold text-[#F5F0E8] truncate">{userEmail}</p>
                <p className="text-[8px] xl:text-[9px] font-bold text-[#5A5A7A] tracking-wider uppercase">POWERED BY VELIOS AI</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="p-1 rounded-lg text-[#F5F0E8]/60 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4 xl:h-4.5 xl:w-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
