"use client";

import SensitiveTopicsView from "@/components/views/SensitiveTopicsView";
import { useDashboard } from "../layout";

export default function SujetsSensiblesPage() {
  const { setMobileMenuOpen } = useDashboard();
  return <SensitiveTopicsView setMobileMenuOpen={setMobileMenuOpen} />;
}
