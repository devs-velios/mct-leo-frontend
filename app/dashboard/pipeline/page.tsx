"use client";

import PipelineManagementView from "@/components/PipelineManagementView";
import { useDashboard } from "../layout";

export default function PipelinePage() {
  const { setMobileMenuOpen } = useDashboard();
  return <PipelineManagementView setMobileMenuOpen={setMobileMenuOpen} />;
}
