"use client";

import PipelineManagementView from "@/components/views/PipelineManagementView";
import { useDashboard } from "../layout";

export default function PipelinePage() {
  const { setMobileMenuOpen } = useDashboard();
  return <PipelineManagementView setMobileMenuOpen={setMobileMenuOpen} />;
}
