"use client";

import { Menu } from "lucide-react";
import SensitiveTopicsSettings from "@/components/settings/SensitiveTopicsSettings";

/** Sensitive topics page — per-subject "supervisor approval" toggles for Léo's replies. */
export default function SensitiveTopicsView({ setMobileMenuOpen }: { setMobileMenuOpen?: (o: boolean) => void }) {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#F5F5F7]">
      <header className="border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur lg:px-6">
        <div className="mb-3 flex items-center justify-between md:hidden">
          <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
          <button onClick={() => setMobileMenuOpen?.(true)} className="rounded-lg p-2 text-[#332151] hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div>
          <h1 className="font-serif-mct text-base sm:text-xl font-bold text-[#332151]">Sujets sensibles</h1>
          <p className="text-xs text-[#5A5A7A]">Choisir les sujets dont les réponses de Léo passent par une validation superviseur.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 custom-scrollbar lg:p-6">
        <SensitiveTopicsSettings />
      </div>
    </div>
  );
}
