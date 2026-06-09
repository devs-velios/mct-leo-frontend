"use client";

/**
 * SidebarSubmenu — a collapsible nested-navigation item, adapted from the
 * 21st.dev "sidebar-with-submenu" (float_ui) component.
 *
 * Rebranded to the MCT palette and wired into the app's shadcn <Sidebar/>
 * system so it inherits the existing mobile sheet, icon-collapse, and
 * animations. The accordion open/close is animated (height + chevron),
 * respecting reduced-motion. Drop it inside a <SidebarMenu/> like any other
 * <SidebarMenuItem/>.
 */

import { useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

export interface SidebarSubmenuItem {
  /** Navigation key — passed to onNavigate and matched against activeTab. */
  name: string;
  /** Optional display label (defaults to `name`). */
  label?: string;
}

interface SidebarSubmenuProps {
  label: string;
  icon: LucideIcon;
  items: SidebarSubmenuItem[];
  activeTab: string;
  onNavigate: (name: string) => void;
}

export function SidebarSubmenu({ label, icon: Icon, items, activeTab, onNavigate }: SidebarSubmenuProps) {
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const reduceMotion = useReducedMotion();

  const childActive = items.some((i) => i.name === activeTab);
  // Until the user toggles, the group follows the active route (auto-expands
  // when a child is active). After an explicit toggle, the override wins.
  const [openOverride, setOpenOverride] = useState<boolean | null>(null);
  const open = openOverride ?? childActive;

  const handleParent = () => {
    // When the rail is collapsed to icons there's no room for the accordion,
    // so the parent jumps straight to its primary sub-page instead.
    if (collapsed) onNavigate(items[0].name);
    else setOpenOverride(!open);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={childActive}
        tooltip={label}
        onClick={handleParent}
        aria-expanded={open}
        className={cn("h-9 font-semibold", childActive ? "!bg-white/[0.06] !text-[#E34F2D]" : "text-sidebar-foreground/75")}
      >
        <Icon className={childActive ? "text-[#E34F2D]" : "text-sidebar-foreground/55"} />
        <span>{label}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-sidebar-foreground/40 transition-transform duration-200 group-data-[collapsible=icon]:hidden",
            open && "rotate-180",
          )}
        />
      </SidebarMenuButton>

      <AnimatePresence initial={false}>
        {open && !collapsed && (
          <motion.ul
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="ml-4 mt-0.5 overflow-hidden border-l border-sidebar-border pl-2 group-data-[collapsible=icon]:hidden"
          >
            {items.map((item) => {
              const active = activeTab === item.name;
              return (
                <li key={item.name}>
                  <button
                    onClick={() => onNavigate(item.name)}
                    className={cn(
                      "flex w-full items-center gap-x-2 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-white/[0.06] text-[#E34F2D]"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", active ? "bg-[#E34F2D]" : "bg-sidebar-foreground/30")} />
                    <span className="truncate">{item.label ?? item.name}</span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </SidebarMenuItem>
  );
}

export default SidebarSubmenu;
