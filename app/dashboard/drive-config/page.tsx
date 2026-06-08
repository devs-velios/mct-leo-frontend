"use client";

// "Dossiers Drive" has been merged into the single Drive page (Configuration tab).
// Keep this route as a redirect so any existing links still land in the right place.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DriveConfigPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/drive"); }, [router]);
  return null;
}
