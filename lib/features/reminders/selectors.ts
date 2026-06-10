// Reminders feature — domain selectors. The due-date bucketing for the dashboard
// chart lives here so the chart component keeps only its recharts config.

import { type Reminder } from "./types";

const DAY = 86_400_000;

export interface DueBucket { name: string; value: number }

/**
 * Bucket pending reminders by how soon they are due, relative to `now`:
 * En retard → Aujourd'hui → ≤ 7 j → ≤ 30 j → Plus tard. Returns the ordered
 * buckets + the total pending count.
 */
export function remindersByDueBucket(reminders: Reminder[], now: number): { buckets: DueBucket[]; total: number } {
  const buckets: DueBucket[] = [
    { name: "En retard", value: 0 },
    { name: "Aujourd'hui", value: 0 },
    { name: "≤ 7 j", value: 0 },
    { name: "≤ 30 j", value: 0 },
    { name: "Plus tard", value: 0 },
  ];
  const startOfTomorrow = new Date(now).setHours(24, 0, 0, 0);
  let total = 0;
  for (const r of reminders) {
    if (r.status !== "pending") continue;
    const t = new Date(r.scheduled_at).getTime();
    if (Number.isNaN(t)) continue;
    total += 1;
    if (t < now) buckets[0].value += 1;
    else if (t < startOfTomorrow) buckets[1].value += 1;
    else if (t < now + 7 * DAY) buckets[2].value += 1;
    else if (t < now + 30 * DAY) buckets[3].value += 1;
    else buckets[4].value += 1;
  }
  return { buckets, total };
}
