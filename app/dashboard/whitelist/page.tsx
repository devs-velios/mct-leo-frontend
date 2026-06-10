"use client";

import WhitelistView from "@/components/WhitelistView";
import { useDashboard } from "../layout";

export default function WhitelistPage() {
  const { setMobileMenuOpen } = useDashboard();
  return <WhitelistView setMobileMenuOpen={setMobileMenuOpen} />;
}
