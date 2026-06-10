"use client";

import {
  LayoutDashboard,
  Building2,
  Folder,
  Map,
  CheckSquare,
  Bell,
  Sparkles,
  MessageSquareText,
  Settings2,
  Zap,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  User,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarSubmenu, type SidebarSubmenuItem } from "@/components/ui/sidebar-with-submenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem { name: string; icon: LucideIcon; children?: SidebarSubmenuItem[]; }
interface NavGroup { label: string; items: NavItem[]; }

// Grouped navigation — journey order: pilotage → réseau → files d'attente → outils.
const NAV_GROUPS: NavGroup[] = [
  { label: "Pilotage", items: [{ name: "Dashboard", icon: LayoutDashboard }] },
  {
    label: "Réseau",
    items: [
      { name: "Centres", icon: Building2 },
      { name: "Dossiers", icon: Folder },
      { name: "Carte", icon: Map },
    ],
  },
  {
    label: "À traiter",
    items: [
      { name: "Validations", icon: CheckSquare },
      { name: "Approbations", icon: MessageSquareText },
      { name: "Rappels", icon: Bell },
    ],
  },
  {
    label: "Outils",
    items: [
      { name: "Assistant", icon: Sparkles },
      {
        name: "Paramètres",
        icon: Settings2,
        children: [
          { name: "Utilisateurs", label: "Utilisateurs" },
          { name: "Pipeline", label: "Pipeline" },
          { name: "Whitelist", label: "Whitelist" },
          { name: "Drive", label: "Drive Management" },
        ],
      },
      { name: "Simulateur", icon: Zap },
    ],
  },
];

interface AppSidebarProps {
  activeTab: string;
  /** Active Drive sub-view, so the Drive submenu can highlight the right child. */
  driveTab?: "explorer" | "config";
  onNavigate: (tab: string) => void;
  userEmail: string;
  onLogout: () => void;
}

export default function AppSidebar({ activeTab, driveTab = "explorer", onNavigate, userEmail, onLogout }: AppSidebarProps) {
  const { toggleSidebar, setOpenMobile, isMobile } = useSidebar();
  // On mobile, close the sheet after navigating so the page is fully visible.
  const handleNav = (name: string) => {
    onNavigate(name);
    if (isMobile) setOpenMobile(false);
  };
  return (
    <Sidebar collapsible="icon" className="border-none">
      {/* Brand */}
      <SidebarHeader className="px-2 py-4">
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2.5">
          {/* Logo — always visible, centred when collapsed */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-md group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9">
            <img src="/foxy.svg" alt="Léo" className="h-full w-full object-contain" />
          </div>
          {/* Brand text — hidden when collapsed */}
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <h1 className="truncate font-serif-mct text-lg font-bold tracking-tight text-sidebar-foreground">MCT Léo</h1>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#E34F2D]">AI Onboarding</p>
          </div>
          {/* Collapse / expand toggle */}
          <button
            onClick={toggleSidebar}
            title="Réduire / agrandir le menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ChevronsLeft className="h-4 w-4 group-data-[collapsible=icon]:hidden" />
            <ChevronsRight className="hidden h-4 w-4 group-data-[collapsible=icon]:block" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1.5 py-2">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-extrabold uppercase tracking-widest text-sidebar-foreground/45">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  // Items with children render as an animated collapsible submenu.
                  if (item.children) {
                    // "Drive Management" is a single entry → /dashboard/drive (the page has its
                    // own Explorateur / Dossiers & Routage tabs), so plain path-based matching.
                    const submenuActiveTab = activeTab;
                    return (
                      <SidebarSubmenu
                        key={item.name}
                        label={item.name}
                        icon={Icon}
                        items={item.children}
                        activeTab={submenuActiveTab}
                        onNavigate={handleNav}
                      />
                    );
                  }
                  const active = activeTab === item.name;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.name}
                        onClick={() => handleNav(item.name)}
                        className={`h-9 font-semibold ${active ? "!text-[#E34F2D] !bg-white/[0.06]" : "text-sidebar-foreground/75"}`}
                      >
                        <Icon className={active ? "text-[#E34F2D]" : "text-sidebar-foreground/55"} />
                        <span>{item.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Account — dropdown menu with logout */}
      <SidebarFooter className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2.5 rounded-xl bg-white/5 p-2 text-left transition-colors hover:bg-white/10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
              <div className="relative shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sidebar-foreground">
                  <User className="h-4 w-4" />
                </div>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#332151]" />
              </div>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-[11px] font-bold text-sidebar-foreground">{userEmail}</p>
                <p className="text-[9px] font-semibold text-sidebar-foreground/50">Opérateur</p>
              </div>
              <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="truncate text-xs font-bold normal-case tracking-normal text-[#332151]">
              {userEmail}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700">
              <LogOut /> Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
