"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { DonutChart } from "@/components/ui/donut-chart";
import { FunnelChart } from "@/components/ui/funnel-chart";
import { useDashboardContext } from "@/lib/features/dashboard/DashboardProvider";
import { useDossiersContext } from "@/lib/features/dossiers";
import { Skeleton } from "@/components/ui/Skeleton";

const STATUT_META: Record<string, { color: string; label: string }> = {
  onboarding: { color: "#EA5B2D", label: "Onboarding" },
  audit: { color: "#F59E0B", label: "Audit" },
  agrement_en_cours: { color: "#6366F1", label: "Agrément" },
  ouvert: { color: "#10B981", label: "Ouvert" },
  bloque: { color: "#EF4444", label: "Bloqué" }
};

// Micro pipeline stages (mirrors the backend) → short labels for the "by stage" bar chart.
const STAGE_ORDER = [
  "signature_validee", "plans_valides", "installation_qualite",
  "audit", "depot_agrement", "agrement_recu", "ouverture",
] as const;
const STAGE_LABEL: Record<string, string> = {
  signature_validee: "Signature",
  plans_valides: "Plans",
  installation_qualite: "Installation",
  audit: "Audit",
  depot_agrement: "Dépôt",
  agrement_recu: "Agrément",
  ouverture: "Ouverture",
};

// Data types
interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

// 1. Custom Area Chart Tooltip
const CustomAreaTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white text-[#1A1A1A] shadow-[0_10px_35px_rgba(0,0,0,0.08)] rounded-xl border border-slate-100 text-xs">
        <p className="font-bold text-[#5A5A7A] mb-1">{label}</p>
        <p className="font-extrabold text-[#EA5B2D] text-sm">
          Dossiers : <span className="text-[#2D2A56]">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

// 2. Custom Bar Chart Tooltip
const CustomBarTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white text-[#1A1A1A] shadow-[0_10px_35px_rgba(0,0,0,0.08)] rounded-xl border border-slate-100 text-xs">
        <p className="font-bold text-[#5A5A7A] mb-1">{label}</p>
        <p className="font-extrabold text-[#EA5B2D] text-sm">
          Dossiers : <span className="text-[#2D2A56]">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

// 3. Custom Document Progress Tooltip
const CustomDocTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const manquantes = payload.find(p => p.dataKey === "Manquantes")?.value || 0;
    const validees = payload.find(p => p.dataKey === "Validées")?.value || 0;
    const total = (manquantes as number) + (validees as number);
    const pctValidees = total > 0 ? Math.round((validees as number) / total * 100) : 0;
    const pctManquantes = total > 0 ? Math.round((manquantes as number) / total * 100) : 0;
    return (
      <div className="p-3 bg-white text-[#1A1A1A] shadow-[0_10px_35px_rgba(0,0,0,0.08)] rounded-xl border border-slate-100 text-xs">
        <p className="font-bold text-[#2D2A56] mb-1">{label}</p>
        <p className="text-slate-500 font-semibold">
          Validées : <span className="text-[#10B981] font-bold">{pctValidees}%</span>
        </p>
        <p className="text-slate-500 font-semibold mt-0.5">
          Manquantes : <span className="text-[#5A5A7A] font-bold">{pctManquantes}%</span>
        </p>
      </div>
    );
  }
  return null;
};

// 4. Custom Doughnut Chart Tooltip
const CustomDoughnutTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white text-[#1A1A1A] shadow-[0_10px_35px_rgba(0,0,0,0.08)] rounded-xl border border-slate-100 text-xs">
        <p className="font-bold text-[#2D2A56]">{payload[0].name}</p>
        <p className="text-slate-500 font-semibold mt-0.5">
          Centres : <span className="text-[#EA5B2D] font-bold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Charts() {
  const [mounted, setMounted] = useState(false);
  const { stats, isLoading } = useDashboardContext();
  const { dossiers, ensureLoaded } = useDossiersContext();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);

  // Donut "Par phase" — real centres grouped by macro status.
  const byStatut = stats?.centres.by_statut ?? {};
  const totalCentres = stats?.centres.total ?? 0;
  const donutLive = Object.entries(byStatut).map(([k, v]) => ({
    value: v as number,
    color: STATUT_META[k]?.color ?? "#8A88A8",
    label: STATUT_META[k]?.label ?? k
  }));

  // 1. Area Chart — new dossiers per week (last 8 weeks), computed from real created_at.
  const areaData = useMemo(() => {
    const DAY = 86_400_000;
    const now = Date.now();
    const buckets = Array.from({ length: 8 }, (_, i) => {
      const end = now - (7 - i) * 7 * DAY;
      const start = end - 7 * DAY;
      return { start, end, name: new Date(end).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), dossiers: 0 };
    });
    for (const d of dossiers) {
      const t = new Date(d.created_at).getTime();
      const b = buckets.find((w) => t > w.start && t <= w.end);
      if (b) b.dossiers += 1;
    }
    return buckets.map((b) => ({ name: b.name, dossiers: b.dossiers }));
  }, [dossiers]);
  const areaMax = Math.max(4, ...areaData.map((d) => d.dossiers));

  // 2. Bar Chart — real count of dossiers per pipeline stage.
  const byStage = stats?.dossiers.by_stage ?? {};
  const barData = STAGE_ORDER.map((k) => ({ name: STAGE_LABEL[k] ?? k, count: byStage[k] ?? 0 }));
  const barMax = Math.max(4, ...barData.map((d) => d.count));

  // 3. Donut Chart Data — live (fallback placeholder while loading/empty)
  const donutData = donutLive.length ? donutLive : [{ value: 1, color: "#E2E8F0", label: "—" }];
  const dominantPhase = donutLive.slice().sort((a, b) => b.value - a.value)[0]?.label ?? "Centres";

  // 4. Funnel Chart — real pieces: total received → still to validate → validated.
  const piecesTotal = stats?.pieces.total ?? 0;
  const piecesVerified = stats?.pieces.verified ?? 0;
  const funnelData = [
    { label: "Reçues", value: piecesTotal, color: "#8A88A8" },
    { label: "À valider", value: Math.max(0, piecesTotal - piecesVerified), color: "#EA5B2D" },
    { label: "Validées", value: piecesVerified, color: "#10B981" }
  ];

  if (!mounted || isLoading) {
    return (
      <div className="space-y-4 lg:space-y-5">
        <div>
          <Skeleton className="h-3 w-40 mb-2" />
          <Skeleton className="h-6 w-56" />
        </div>
        <div className="grid gap-4 lg:gap-5 xl:gap-6 grid-cols-1 md:grid-cols-2 w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-56 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#EA5B2D] mb-1">
          <span>Données & Performance</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#EA5B2D] animate-pulse"></span>
          <span className="text-[#2D2A56] font-bold">Analyses</span>
        </div>
        <h3 className="text-xl font-bold font-serif-mct text-[#2D2A56]">
          Analytics & Insights
        </h3>
      </div>

      {/* 2x2 Grid Layout */}
      <div className="grid gap-4 lg:gap-5 xl:gap-6 grid-cols-1 md:grid-cols-2 w-full">
        
        {/* Chart 1: Performance Trend Chart (Tendance) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-6 rounded-3xl bg-white border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between h-full"
        >
          <div className="flex items-center justify-between mb-6 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#EA5B2D]">Tendance</span>
              <h4 className="text-base font-bold font-serif-mct text-[#2D2A56]">Nouveaux dossiers / semaine</h4>
              <p className="text-[10px] text-[#5A5A7A] mt-0.5">8 dernières semaines</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#EA5B2D] px-2.5 py-1 rounded bg-[#EA5B2D]/5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Hebdomadaire</span>
            </div>
          </div>

          <div className="h-56 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EA5B2D" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#EA5B2D" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#5A5A7A"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  stroke="#5A5A7A"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fontWeight: 700 }}
                  domain={[0, areaMax]}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: "#5A5A7A", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area
                  type="monotone"
                  dataKey="dossiers"
                  stroke="#EA5B2D"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#areaGrad)"
                  activeDot={{ r: 6, stroke: "white", strokeWidth: 2, fill: "#EA5B2D" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-[9px] font-bold uppercase mt-4 pt-3 border-t border-slate-50">
            <span className="flex items-center gap-1.5 text-[#EA5B2D]">
              <span className="h-2 w-2 rounded-full bg-[#EA5B2D]"></span> Dossiers
            </span>
          </div>
        </motion.div>

        {/* Chart 2: Distribution Pie Chart (Répartition) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="p-6 rounded-3xl bg-white border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between h-full"
        >
          <div className="pb-3 mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#EA5B2D]">Répartition</span>
            <h4 className="text-base font-bold font-serif-mct text-[#2D2A56]">Par phase</h4>
            <p className="text-[10px] text-[#5A5A7A] mt-0.5">Dossiers actifs</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative">
            <DonutChart
              data={donutData}
              size={180}
              strokeWidth={20}
              animationDuration={1.2}
              animationDelayPerSegment={0.05}
              highlightOnHover={true}
              centerContent={
                <div className="text-center flex flex-col items-center select-none pointer-events-none">
                  <span className="text-xs font-bold text-[#5A5A7A] uppercase tracking-wider leading-none mb-1.5">
                    {dominantPhase}
                  </span>
                  <span className="text-4xl font-extrabold font-serif-mct text-[#2D2A56] leading-none">
                    {totalCentres}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Centres
                  </span>
                </div>
              }
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3 text-[9px] font-bold uppercase mt-4 pt-3 border-t border-slate-50">
            {donutLive.map((d) => (
              <span key={d.label} className="flex items-center gap-1.5 text-[#5A5A7A]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }}></span>
                {d.label} ({d.value})
              </span>
            ))}
          </div>
        </motion.div>

        {/* Chart 3: Growth Bar Chart (Cadence) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="p-6 rounded-3xl bg-white border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between h-full"
        >
          <div className="flex items-center justify-between mb-6 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#EA5B2D]">Pipeline</span>
              <h4 className="text-base font-bold font-serif-mct text-[#2D2A56]">Dossiers par étape</h4>
              <p className="text-[10px] text-[#5A5A7A] mt-0.5">Répartition dans le pipeline d'agrément</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#EA5B2D] px-2.5 py-1 rounded bg-[#EA5B2D]/5">
              <Clock className="h-3.5 w-3.5" />
              <span>Temps réel</span>
            </div>
          </div>

          <div className="h-56 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#5A5A7A"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 8, fontWeight: 700 }}
                  dy={10}
                  interval={0}
                  angle={12}
                />
                <YAxis
                  stroke="#5A5A7A"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fontWeight: 700 }}
                  domain={[0, barMax]}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "#F8FAFC", opacity: 0.8 }} />
                <Bar
                  dataKey="count"
                  fill="#EA5B2D"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-[9px] font-bold uppercase mt-4 pt-3 border-t border-slate-50">
            <span className="flex items-center gap-1.5 text-[#EA5B2D]">
              <span className="h-2 w-2 rounded-sm bg-[#EA5B2D]"></span> Dossiers
            </span>
          </div>
        </motion.div>

        {/* Chart 4: Activity Comparison Chart (Collecte Documentaire) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="p-6 rounded-3xl bg-white border border-slate-100/50 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between h-full min-w-0"
        >
          <div className="pb-3 mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#EA5B2D]">Collecte Documentaire</span>
            <h4 className="text-base font-bold font-serif-mct text-[#2D2A56]">Suivi des pièces</h4>
            <p className="text-[10px] text-[#5A5A7A] mt-0.5">Pièces reçues, à valider et validées</p>
          </div>

          <div className="h-56 w-full relative min-w-0 flex items-center justify-center">
            <FunnelChart
              data={funnelData}
              orientation="horizontal"
              layers={3}
              labelLayout="grouped"
              labelAlign="center"
              labelOrientation="vertical"
              showPercentage={true}
              showValues={true}
              showLabels={true}
              className="w-[90%] max-w-lg"
            />
          </div>

          <div className="flex justify-center gap-4 text-[9px] font-bold uppercase mt-4 pt-3 border-t border-slate-50">
            <span className="flex items-center gap-1.5 text-[#8A88A8]">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#8A88A8]"></span> Reçues
            </span>
            <span className="flex items-center gap-1.5 text-[#EA5B2D]">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#EA5B2D]"></span> À valider
            </span>
            <span className="flex items-center gap-1.5 text-[#10B981]">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#10B981]"></span> Validées
            </span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

