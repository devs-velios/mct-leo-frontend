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
import { useDossiersContext } from "@/lib/features/dossiers";

const DAY = 86_400_000;
const HOUR = 3_600_000;

type PeriodKey = "24h" | "7d" | "30d" | "90d" | "1an";

const PERIODS: { key: PeriodKey; label: string; windowMs: number; buckets: number; step: number }[] = [
  { key: "24h", label: "24 h", windowMs: DAY, buckets: 8, step: 3 * HOUR },
  { key: "7d", label: "7 j", windowMs: 7 * DAY, buckets: 7, step: DAY },
  { key: "30d", label: "30 j", windowMs: 30 * DAY, buckets: 10, step: 3 * DAY },
  { key: "90d", label: "90 j", windowMs: 90 * DAY, buckets: 12, step: 7.5 * DAY },
  { key: "1an", label: "1 an", windowMs: 365 * DAY, buckets: 12, step: 365 / 12 * DAY },
];

function labelFor(period: PeriodKey, end: number): string {
  const d = new Date(end);
  if (period === "24h") return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (period === "1an") return d.toLocaleDateString("fr-FR", { month: "short" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

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

  const cfg = PERIODS.find((p) => p.key === period)!;

  const data = useMemo(() => {
    if (now == null) return [] as { name: string; dossiers: number }[];
    const start0 = now - cfg.windowMs;
    const buckets = Array.from({ length: cfg.buckets }, (_, i) => {
      const end = start0 + (i + 1) * cfg.step;
      return { start: end - cfg.step, end, name: labelFor(period, end), dossiers: 0 };
    });
    for (const d of dossiers) {
      const t = new Date(d.created_at).getTime();
      if (Number.isNaN(t) || t <= start0 || t > now) continue;
      const b = buckets.find((w) => t > w.start && t <= w.end);
      if (b) b.dossiers += 1;
    }
    return buckets.map((b) => ({ name: b.name, dossiers: b.dossiers }));
  }, [dossiers, cfg, period, now]);

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
