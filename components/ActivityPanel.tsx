"use client";

import { 
  FileText, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Cpu, 
  AlertCircle 
} from "lucide-react";

interface ActivityItem {
  id: number;
  centre: string;
  detail: string;
  temps: string;
  type: string;
}

interface ActivityPanelProps {
  activities: ActivityItem[];
}

export default function ActivityPanel({ activities }: ActivityPanelProps) {
  // Helper to map type to premium customized badge icons
  const getActivityIconBadge = (type: string) => {
    switch (type) {
      case "system":
        return (
          <span className="p-2 xl:p-2.5 rounded-xl bg-slate-100 text-[#5A5A7A] inline-flex items-center justify-center shrink-0 shadow-sm border border-slate-200/40">
            <Cpu className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
          </span>
        );
      case "document":
        return (
          <span className="p-2 xl:p-2.5 rounded-xl bg-[#2D2A56]/5 text-[#2D2A56] inline-flex items-center justify-center shrink-0 shadow-sm border border-[#2D2A56]/5">
            <FileText className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
          </span>
        );
      case "whatsapp":
        return (
          <span className="p-2 xl:p-2.5 rounded-xl bg-emerald-50 text-emerald-600 inline-flex items-center justify-center shrink-0 shadow-sm border border-emerald-100/50">
            <MessageSquare className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
          </span>
        );
      case "reminder":
        return (
          <span className="p-2 xl:p-2.5 rounded-xl bg-orange-50 text-[#EA5B2D] inline-flex items-center justify-center shrink-0 shadow-sm border border-orange-100/50">
            <Clock className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
          </span>
        );
      case "validation":
        return (
          <span className="p-2 xl:p-2.5 rounded-xl bg-emerald-50 text-emerald-600 inline-flex items-center justify-center shrink-0 shadow-sm border border-emerald-100/50">
            <CheckCircle2 className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
          </span>
        );
      case "rag":
        return (
          <span className="p-2 xl:p-2.5 rounded-xl bg-[#EA5B2D]/10 text-[#EA5B2D] inline-flex items-center justify-center shrink-0 shadow-sm border border-[#EA5B2D]/10">
            <Cpu className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
          </span>
        );
      default:
        return (
          <span className="p-2 xl:p-2.5 rounded-xl bg-slate-50 text-slate-400 inline-flex items-center justify-center shrink-0">
            <AlertCircle className="h-3.5 xl:h-4 w-3.5 xl:w-4" />
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-3xl glow-effect bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col h-full w-full min-w-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-3 shrink-0">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">LIVE</span>
          <h4 className="text-base font-bold font-serif-mct text-[#2D2A56]">Activité temps réel</h4>
          <p className="text-[10px] text-[#5A5A7A] mt-0.5">Pipeline - WhatsApp - Agent IA</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          Realtime
        </span>
      </div>

      {/* Activity Feed stream list (flexible scroll height filling all available space) */}
      <div className="flex-1 overflow-y-auto pr-2 sm:pr-3.5 custom-scrollbar min-h-0 space-y-3.5 xl:space-y-4">
        {activities.map((act) => (
          <div key={act.id} className="group flex items-start gap-3 xl:gap-4 p-3 xl:p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-100/90 transition-all duration-200 shadow-sm border border-slate-100 hover:border-[#EA5B2D]/20">
            {getActivityIconBadge(act.type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] xl:text-xs font-extrabold text-[#2D2A56] truncate uppercase tracking-wider">
                  {act.centre}
                </span>
                <span className="text-[8.5px] xl:text-[9px] font-bold text-slate-400 whitespace-nowrap">
                  {act.temps}
                </span>
              </div>
              <p className="text-[11px] xl:text-xs text-[#5A5A7A] leading-relaxed font-medium mt-1">
                {act.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

