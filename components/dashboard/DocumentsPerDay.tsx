"use client";

import { useEffect, useMemo, useState } from "react";
import { FileStack } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { Panel, EmptyState } from "./Panel";
import { usePiecesContext, queueItemToValidation } from "@/lib/features/pieces";
import { documentsPerDay } from "@/lib/features/dashboard";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";

const SERIES = [
  { key: "aValider", label: "À valider", color: "#E34F2D" },
  { key: "valides", label: "Validés", color: "#059669" },
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

export default function DocumentsPerDay() {
  const { queue, ensureQueue } = usePiecesContext();
  const [range, setRange] = useState<DateRange | null>(null);

  useEffect(() => { ensureQueue(); }, [ensureQueue]);
  // Default to the last 14 days once mounted.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const now = new Date();
    setRange({ start: startOfDay(subDays(now, 13)), end: endOfDay(now) });
  }, []);

  const items = useMemo(
    () => queue.map(queueItemToValidation).map((v) => ({ createdAt: v.createdAt, status: v.status })),
    [queue],
  );
  const data = useMemo(() => {
    if (!range?.start || !range?.end) return [];
    return documentsPerDay(items, range.start.getTime(), range.end.getTime());
  }, [items, range]);
  const total = data.reduce((s, d) => s + d.aValider + d.valides, 0);

  return (
    <Panel
      title="Documents par jour"
      subtitle="Reçus à valider vs. validés"
      actions={<DateRangePicker value={range} onChange={setRange} align="end" />}
    >
      {total === 0 ? (
        <EmptyState icon={FileStack} message="Aucun document sur cette période" hint="Élargissez la période." />
      ) : (
        <div className="h-48 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" stroke="#5A5A7A" tickLine={false} axisLine={false} tick={{ fontSize: 9, fontWeight: 700 }} dy={8} interval="preserveStartEnd" />
              <YAxis stroke="#5A5A7A" tickLine={false} axisLine={false} tick={{ fontSize: 9, fontWeight: 700 }} allowDecimals={false} />
              <Tooltip content={<Tip />} cursor={{ fill: "#F8FAFC", opacity: 0.8 }} />
              <Legend
                verticalAlign="top"
                align="right"
                height={24}
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span className="text-[11px] font-semibold text-[#5A5A7A]">{SERIES.find((s) => s.key === v)?.label ?? v}</span>}
              />
              {SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={22} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
