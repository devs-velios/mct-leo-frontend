"use client";

import FonctionnementView from "@/components/views/FonctionnementView";
import { useDashboard } from "../layout";

export default function FonctionnementPage() {
  const { setMobileMenuOpen } = useDashboard();

  return (
    <FonctionnementView 
      setMobileMenuOpen={setMobileMenuOpen} 
    />
  );
}
