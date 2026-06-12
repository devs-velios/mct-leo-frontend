"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { Panel, EmptyState } from "./Panel";
import { useDossiersContext } from "@/lib/features/dossiers";
import { useCentresContext } from "@/lib/features/centres";
import { creationTrend } from "@/lib/features/dashboard";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";

const SERIES = [
  { key: "dossiers", label: "Nouveaux dossiers", color: "#E34F2D" },
  { key: "centres", label: "Nouveaux centres", color: "#332151" },
] as const;

const Tip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 text-xs shadow-[0_10px_35px_rgba(0,0,0,0.08)]">
      <p className="mb-1.5 font-bold text-[#5A5A7A]">{label}</p>
      {SERIES.map((s) => {
        const p = payload.find((x) => x.dataKey === s.key);
        return (
          <p key={s.key} className="flex items-center gap-1.5 font-semibold text-[#332151]">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label} : <span className="font-extrabold">{p?.value ?? 0}</span>
          </p>
        );
      })}
    </div>
  );
};

export default function TrendChart() {
  const { dossiers, ensureLoaded } = useDossiersContext();
  const { centres, ensureList } = useCentresContext();
  const [range, setRange] = useState<DateRange | null>(null);

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);
  // Default to the last 30 days once mounted (wall clock is an external system).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const now = new Date();
    setRange({ start: startOfDay(subDays(now, 29)), end: endOfDay(now) });
  }, []);

  const data = useMemo(() => {
    if (!range?.start || !range?.end) return [];
    return creationTrend(dossiers, centres, range.start.getTime(), range.end.getTime());
  }, [dossiers, centres, range]);

  const totalDossiers = data.reduce((s, d) => s + d.dossiers, 0);
  const totalCentres = data.reduce((s, d) => s + d.centres, 0);
  const max = Math.max(4, ...data.map((d) => Math.max(d.dossiers, d.centres)));

  return (
    <Panel
      title="Évolution des créations"
      subtitle={`${totalDossiers} dossier${totalDossiers > 1 ? "s" : ""} · ${totalCentres} centre${totalCentres > 1 ? "s" : ""} sur la période`}
      actions={<DateRangePicker value={range} onChange={setRange} />}
    >
      {totalDossiers === 0 && totalCentres === 0 ? (
        <EmptyState
          icon={TrendingUp}
          message="Aucune création sur cette période"
          hint="Élargissez la période ou créez un centre / dossier."
        />
      ) : (
        <motion.div
          key={`${range?.start?.getTime()}-${range?.end?.getTime()}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="h-72 w-full text-xs"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" stroke="#5A5A7A" tickLine={false} axisLine={false} tick={{ fontSize: 9, fontWeight: 700 }} dy={10} interval="preserveStartEnd" />
              <YAxis stroke="#5A5A7A" tickLine={false} axisLine={false} tick={{ fontSize: 9, fontWeight: 700 }} domain={[0, max]} allowDecimals={false} />
              <Tooltip content={<Tip />} cursor={{ stroke: "#5A5A7A", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Legend
                verticalAlign="top"
                align="right"
                height={28}
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span className="text-[11px] font-semibold text-[#5A5A7A]">{SERIES.find((s) => s.key === v)?.label ?? v}</span>}
              />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, stroke: "white", strokeWidth: 2, fill: s.color }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </Panel>
  );
}
