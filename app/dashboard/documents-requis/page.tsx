"use client";

import RequiredDocumentsView from "@/components/views/RequiredDocumentsView";
import { useDashboard } from "../layout";

export default function DocumentsRequisPage() {
  const { setMobileMenuOpen } = useDashboard();
  return <RequiredDocumentsView setMobileMenuOpen={setMobileMenuOpen} />;
}
