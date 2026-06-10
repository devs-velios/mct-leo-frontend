"use client";

// Draggable, reorderable list (HTML5 drag + framer-motion layout animations).
// Adapted to this codebase: uses the shared `cn`, `framer-motion` (already a dep)
// and the brand palette. The internal order re-syncs whenever the parent passes a
// new id-sequence, so a controlled parent (e.g. persisted reorder) stays authoritative.

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DraggableItemProps {
  id: string;
  content: React.ReactNode;
}

export interface DraggableListProps {
  items: DraggableItemProps[];
  onChange?: (items: DraggableItemProps[]) => void;
  className?: string;
  itemClassName?: string;
}

export const DraggableList: React.FC<DraggableListProps> = ({ items: initialItems, onChange, className, itemClassName }) => {
  const [items, setItems] = useState(initialItems);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Re-sync when the parent's id-sequence changes (persisted reorder / revert).
  const idsKey = initialItems.map((i) => i.id).join("|");
  useEffect(() => {
    setItems(initialItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDragEnd = () => {
    if (!draggedId || !dragOverId || draggedId === dragOverId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const draggedIndex = items.findIndex((i) => i.id === draggedId);
    const dropIndex = items.findIndex((i) => i.id === dragOverId);
    const next = [...items];
    const [moved] = next.splice(draggedIndex, 1);
    next.splice(dropIndex, 0, moved);
    setItems(next);
    onChange?.(next);
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            draggable
            onDragStart={() => setDraggedId(item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.005)] transition-colors",
              dragOverId === item.id && draggedId !== item.id && "border-2 border-[#E34F2D] bg-[#E34F2D]/[0.04]",
              draggedId === item.id && "border-2 border-slate-300 opacity-50",
              itemClassName,
            )}
          >
            {item.content}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/** Optional row wrapper exposing a grip handle on the left. */
export const DraggableItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-300 active:cursor-grabbing" />
      {children}
    </div>
  );
};
