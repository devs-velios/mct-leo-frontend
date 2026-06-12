"use client";

// ReminderCard — brand-adapted port of the 21st.dev "social-post-card".
// We keep that card's visual language (glassy rounded-3xl shell, a bordered
// icon-tile detail box, and the divided multi-column footer) but map it onto
// reminder semantics instead of social reactions: header = centre + status,
// detail box = the relance reason, footer = Type / Échéance / Programmé.

import { type ReactNode } from "react";
import { FileText, Repeat, Calendar, Clock, MoreHorizontal, Pencil, XCircle, Trash2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ReminderCardProps {
  centreName: string;
  centreCode?: string | null;
  ville?: string | null;
  statusLabel: string;
  statusTone: string; // tailwind classes for the badge
  reason: string;
  kindLabel: string;
  dueType: string | null;
  escalation: number;
  scheduledLabel: string;
  isPending: boolean;
  canOpen: boolean;
  onOpen?: () => void;
  onEdit?: () => void;
  onStop?: () => void;
  onDelete?: () => void;
  onHover?: () => void;
}

// One footer segment (the adapted "reaction" column): tiny label over a value.
function FooterCell({ icon, label, value, accent }: { icon: ReactNode; label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 py-2.5 text-center">
      <span className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-widest text-slate-400">
        <span className="text-slate-300">{icon}</span>
        {label}
      </span>
      <span className={cn("truncate text-[11px] font-bold", accent ? "text-[#E34F2D]" : "text-[#332151]")}>{value}</span>
    </div>
  );
}

export default function ReminderCard({
  centreName,
  centreCode,
  ville,
  statusLabel,
  statusTone,
  reason,
  kindLabel,
  dueType,
  escalation,
  scheduledLabel,
  isPending,
  canOpen,
  onOpen,
  onEdit,
  onStop,
  onDelete,
  onHover,
}: ReminderCardProps) {
  return (
    <div
      onMouseEnter={onHover}
      onClick={canOpen ? onOpen : undefined}
      className={cn(
        "group flex flex-col rounded-3xl border border-slate-200 bg-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-lg transition-all",
        canOpen && "cursor-pointer hover:-translate-y-0.5 hover:border-[#E34F2D]/30 hover:shadow-[0_14px_40px_rgb(234,79,45,0.10)]",
      )}
    >
      {/* Header — centre identity + status, with a manage menu where the bookmark sat. */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#332151]">{centreName}</p>
          {centreCode && <p className="font-mono text-[11px] text-slate-500">{centreCode}</p>}
          {ville && <p className="text-[11px] text-slate-400">{ville}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold", statusTone)}>
            {statusLabel}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#332151]"
                aria-label="Actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[190px]" onClick={(e) => e.stopPropagation()}>
              {isPending && (
                <>
                  {onEdit && <DropdownMenuItem onClick={onEdit}><Pencil /> Modifier</DropdownMenuItem>}
                  {onStop && <DropdownMenuItem onClick={onStop}><XCircle /> Arrêter</DropdownMenuItem>}
                </>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:bg-red-50">
                  <Trash2 /> Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Detail box — the reference card's "link" block: icon tile + reason + escalation. */}
      <div className="mx-5 my-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition group-hover:bg-slate-100/60">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-white p-2 text-[#E34F2D] shadow-sm">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Détails</p>
            <p className="mt-0.5 text-xs font-semibold leading-snug text-[#332151]">{reason}</p>
            {escalation > 0 && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[#E34F2D]/10 px-2 py-0.5 text-[10px] font-semibold text-[#E34F2D]">
                <Repeat className="h-2.5 w-2.5" /> Relance n°{escalation}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Divided footer — the adapted "reactions" row: Type | Échéance | Programmé. */}
      <div className="mt-auto grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200">
        <FooterCell icon={<Repeat className="h-3 w-3" />} label="Type" value={kindLabel} />
        <FooterCell icon={<Clock className="h-3 w-3" />} label="Échéance" value={dueType ?? "—"} accent={!!dueType} />
        <FooterCell icon={<Calendar className="h-3 w-3" />} label="Programmé" value={scheduledLabel} />
      </div>

      {/* Open affordance — appears on hover, mirrors the row-click pattern elsewhere. */}
      {canOpen && (
        <div className="flex items-center justify-end px-5 pb-3 pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); onOpen?.(); }}
            className="h-7 gap-1.5 text-[11px] font-bold text-[#5A5A7A] opacity-70 transition group-hover:text-[#E34F2D] group-hover:opacity-100"
          >
            Ouvrir le dossier <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
