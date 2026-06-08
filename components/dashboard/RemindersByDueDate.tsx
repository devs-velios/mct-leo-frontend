"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Panel, EmptyState } from "./Panel";
import { useRemindersContext } from "@/lib/features/reminders";

const DAY = 86_400_000;

const Tip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-3 text-xs shadow-[0_10px_35px_rgba(0,0,0,0.08)]">
        <p className="mb-1 font-bold text-[#332151]">{label}</p>
        <p className="text-sm font-extrabold text-[#E34F2D]">
          Rappels : <span className="text-[#332151]">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function RemindersByDueDate() {
  const { reminders, ensureLoaded } = useRemindersContext();
  // Capture "now" once after mount so render stays pure (clock = external system).
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
  // Reading the wall clock is a side effect; syncing it into state on mount is the
  // sanctioned pattern (keeps render pure).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setNow(Date.now()); }, []);

  const { data, total } = useMemo(() => {
    const startOfTomorrow = now != null ? new Date(now).setHours(24, 0, 0, 0) : 0;
    const buckets = [
      { name: "En retard", value: 0, color: "#DF3714" },
      { name: "Aujourd'hui", value: 0, color: "#E34F2D" },
      { name: "≤ 7 j", value: 0, color: "#EA5835" },
      { name: "≤ 30 j", value: 0, color: "#4B2F5E" },
      { name: "Plus tard", value: 0, color: "#332151" },
    ];
    let count = 0;
    if (now == null) return { data: buckets, total: 0 };
    for (const r of reminders) {
      if (r.status !== "pending") continue;
      const t = new Date(r.scheduled_at).getTime();
      if (Number.isNaN(t)) continue;
      count += 1;
      if (t < now) buckets[0].value += 1;
      else if (t < startOfTomorrow) buckets[1].value += 1;
      else if (t < now + 7 * DAY) buckets[2].value += 1;
      else if (t < now + 30 * DAY) buckets[3].value += 1;
      else buckets[4].value += 1;
    }
    return { data: buckets, total: count };
  }, [reminders, now]);

  const overdue = data[0].value;

  return (
    <Panel
      eyebrow="Relances"
      title="Rappels par échéance"
      subtitle="Rappels en attente, regroupés par date d'envoi"
      actions={
        overdue > 0 ? (
          <span className="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 tabular-nums">
            {overdue} en retard
          </span>
        ) : (
          <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-[#5A5A7A] tabular-nums">
            {total} en attente
          </span>
        )
      }
    >
      {total === 0 ? (
        <EmptyState icon={BellRing} message="Aucun rappel en attente" hint="Les rappels programmés apparaîtront ici." />
      ) : (
        <div className="h-48 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" stroke="#5A5A7A" tickLine={false} axisLine={false} tick={{ fontSize: 9, fontWeight: 700 }} dy={8} interval={0} />
              <YAxis stroke="#5A5A7A" tickLine={false} axisLine={false} tick={{ fontSize: 9, fontWeight: 700 }} allowDecimals={false} />
              <Tooltip content={<Tip />} cursor={{ fill: "#F8FAFC", opacity: 0.8 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
