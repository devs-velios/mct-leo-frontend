"use client";

import UsersView from "@/components/UsersView";
import { useDashboard } from "../layout";

export default function UtilisateursPage() {
  const { setMobileMenuOpen } = useDashboard();
  return <UsersView setMobileMenuOpen={setMobileMenuOpen} />;
}
