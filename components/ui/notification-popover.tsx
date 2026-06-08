"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
};

interface NotificationItemProps {
  notification: Notification;
  index: number;
  onSelect: (id: string) => void;
}

const NotificationItem = ({ notification, index, onSelect }: NotificationItemProps) => (
  <motion.button
    type="button"
    initial={{ opacity: 0, x: 12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.2, delay: index * 0.04 }}
    onClick={() => onSelect(notification.id)}
    className="w-full p-4 text-left transition-colors hover:bg-slate-50 cursor-pointer"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {!notification.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#EA5B2D]" />}
        <h4 className="truncate text-[13px] font-bold text-[#2D2A56]">{notification.title}</h4>
      </div>
      <span className="shrink-0 text-[10px] font-semibold text-slate-400">
        {notification.timestamp.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
      </span>
    </div>
    <p className="mt-1 text-xs font-medium text-slate-500 leading-snug line-clamp-2">{notification.description}</p>
  </motion.button>
);

interface NotificationPopoverProps {
  notifications: Notification[];
  onMarkAllAsRead?: () => void;
  onSelect?: (id: string) => void;
  emptyLabel?: string;
}

export function NotificationPopover({
  notifications,
  onMarkAllAsRead,
  onSelect,
  emptyLabel = "Aucune notification",
}: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={() => setIsOpen((o) => !o)}
        title={`${unreadCount} alerte${unreadCount > 1 ? "s" : ""}`}
        className={cn(
          "relative h-10 w-10",
          unreadCount > 0 && "border-[#EA5B2D]/30 bg-[#EA5B2D]/10 text-[#EA5B2D] hover:bg-[#EA5B2D]/15"
        )}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EA5B2D] px-1 text-[8px] font-extrabold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 max-h-[60vh] w-80 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#5A5A7A]">Notifications</h3>
              {notifications.length > 0 && onMarkAllAsRead && (
                <Button
                  type="button"
                  onClick={onMarkAllAsRead}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] font-bold text-[#EA5B2D] hover:bg-[#EA5B2D]/5"
                >
                  Tout marquer comme lu
                </Button>
              )}
            </div>

            {notifications.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {notifications.map((n, i) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    index={i}
                    onSelect={(id) => { onSelect?.(id); setIsOpen(false); }}
                  />
                ))}
              </div>
            ) : (
              <p className="px-4 py-8 text-center text-xs font-semibold italic text-slate-400">{emptyLabel}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
