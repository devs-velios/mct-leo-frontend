// Alerts feature — domain selectors. The open-alerts filter and the alert →
// notification mapping live here so the navbar/bell stay presentational.

import { type Alert } from "./types";

/** The currently-open alerts (the feature loads `{status:"open"}`, but be defensive). */
export const openAlerts = (alerts: Alert[]) => alerts.filter((a) => a.status === "open");

export interface AlertNotification {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

/** Map open alerts → the navbar notification view-model (`readIds` marks read ones). */
export function alertsToNotifications(alerts: Alert[], readIds: Set<string>): AlertNotification[] {
  return openAlerts(alerts).map((a) => ({
    id: a.id,
    title: `${a.type}${a.code_centre ? ` · ${a.code_centre}` : ""}`,
    description: a.message,
    timestamp: new Date(a.created_at),
    read: readIds.has(a.id),
  }));
}
