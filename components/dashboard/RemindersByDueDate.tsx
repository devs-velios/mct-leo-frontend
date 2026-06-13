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
import { useRemindersContext, remindersByDueBucket } from "@/lib/features/reminders";

// Per-bucket bar colours (presentational; bucket order matches the feature selector).
const BUCKET_COLORS = ["#DF3714", "#E34F2D", "#EA5835", "#4B2F5E", "#332151"];

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

  // Due-date bucketing lives in the reminders feature; the view adds bar colours.
  const { data, total } = useMemo(() => {
    // Pass 0 before the clock is captured → all buckets render at zero (EmptyState shows).
    const { buckets } = remindersByDueBucket(now == null ? [] : reminders, now ?? 0);
    // Drop the leading "En retard" bucket — only upcoming due windows are shown.
    const future = buckets.slice(1).map((b, i) => ({ ...b, color: BUCKET_COLORS[i + 1] }));
    return { data: future, total: future.reduce((s, b) => s + b.value, 0) };
  }, [reminders, now]);

  return (
    <Panel
      title="Rappels par échéance"
      subtitle="Rappels à venir, regroupés par date d'envoi"
      actions={
        <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-[#5A5A7A] tabular-nums">
          {total} à venir
        </span>
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
