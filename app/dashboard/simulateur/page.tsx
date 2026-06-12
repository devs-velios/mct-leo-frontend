"use client";
import SimulateOdooView from "@/components/views/SimulateOdooView";
import { useDashboard } from "../layout";
export default function SimulateurPage() {
  const { setMobileMenuOpen } = useDashboard();
  return <SimulateOdooView setMobileMenuOpen={setMobileMenuOpen} />;
}
