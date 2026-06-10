"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Panel, EmptyState } from "./Panel";
import { useDossiersContext, TREND_PERIODS as PERIODS, dossiersTrend, type TrendPeriodKey as PeriodKey } from "@/lib/features/dossiers";

const Tip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-3 text-xs shadow-[0_10px_35px_rgba(0,0,0,0.08)]">
        <p className="mb-1 font-bold text-[#5A5A7A]">{label}</p>
        <p className="text-sm font-extrabold text-[#E34F2D]">
          Dossiers : <span className="text-[#332151]">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function TrendChart() {
  const { dossiers, ensureLoaded } = useDossiersContext();
  const [period, setPeriod] = useState<PeriodKey>("30d");
  // Capture "now" once after mount so render stays pure (clock = external system).
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
  // Reading the wall clock is a side effect; syncing it into state on mount is the
  // sanctioned pattern (keeps render pure).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setNow(Date.now()); }, []);

  // Time-series bucketing lives in the dossiers feature (dossiersTrend selector).
  const data = useMemo(
    () => (now == null ? [] : dossiersTrend(dossiers, period, now)),
    [dossiers, period, now],
  );

  const total = data.reduce((s, d) => s + d.dossiers, 0);
  const max = Math.max(4, ...data.map((d) => d.dossiers));

  return (
    <Panel
      eyebrow="Tendance"
      title="Nouveaux dossiers"
      subtitle={`${total} dossier${total > 1 ? "s" : ""} sur la période`}
      actions={
        <div className="flex items-center gap-0.5 rounded-xl bg-slate-50 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors duration-150 ${
                period === p.key
                  ? "bg-white text-[#332151] shadow-sm"
                  : "text-[#5A5A7A] hover:text-[#332151]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      }
    >
      {total === 0 ? (
        <EmptyState
          icon={TrendingUp}
          message="Aucun nouveau dossier sur cette période"
          hint="Essayez une période plus large ou créez un dossier."
        />
      ) : (
        <motion.div
          key={period}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="h-72 w-full text-xs"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E34F2D" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#E34F2D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" stroke="#5A5A7A" tickLine={false} axisLine={false} tick={{ fontSize: 9, fontWeight: 700 }} dy={10} interval="preserveStartEnd" />
              <YAxis stroke="#5A5A7A" tickLine={false} axisLine={false} tick={{ fontSize: 9, fontWeight: 700 }} domain={[0, max]} allowDecimals={false} />
              <Tooltip content={<Tip />} cursor={{ stroke: "#5A5A7A", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Area type="monotone" dataKey="dossiers" stroke="#E34F2D" strokeWidth={3} fill="url(#trendGrad)" activeDot={{ r: 6, stroke: "white", strokeWidth: 2, fill: "#E34F2D" }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </Panel>
  );
}
