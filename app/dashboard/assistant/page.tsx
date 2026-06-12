"use client";

import AssistantView from "@/components/views/AssistantView";
import { useDashboard } from "../layout";

export default function AssistantPage() {
  const { setMobileMenuOpen } = useDashboard();
  return <AssistantView setMobileMenuOpen={setMobileMenuOpen} />;
}
