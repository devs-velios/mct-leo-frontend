"use client";

import AuditLogView from "@/components/views/AuditLogView";
import { useDashboard } from "../layout";

export default function AuditPage() {
  const { setMobileMenuOpen } = useDashboard();
  return <AuditLogView setMobileMenuOpen={setMobileMenuOpen} />;
}
