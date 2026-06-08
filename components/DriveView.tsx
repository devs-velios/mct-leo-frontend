"use client";

import { useEffect, useState } from "react";
import { Menu, Folder, FileText, ChevronRight, Home } from "lucide-react";
import { useDriveContext } from "@/lib/features/drive";
import { SkeletonGrid } from "@/components/ui/Skeleton";

export default function DriveView({ setMobileMenuOpen }: { setMobileMenuOpen?: (o: boolean) => void }) {
  const { byPath, statusByPath, browse } = useDriveContext();
  const [path, setPath] = useState("");

  // Cache-guarded browse: revisiting a directory reuses the cached listing.
  useEffect(() => { browse(path); }, [path, browse]);

  const current = byPath[path];
  const folders = current?.folders ?? [];
  const files = current?.files ?? [];
  const loading = !current && statusByPath[path] !== "error";

  const segments = path ? path.split("/") : [];

  return (
    <>
      <header className="border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur lg:px-6">
        <div className="mb-2 flex items-center justify-between md:hidden">
          <span className="font-serif-mct text-lg font-bold text-[#2D2A56]">MCT Léo</span>
          <button onClick={() => setMobileMenuOpen?.(true)} className="rounded-lg p-2 text-[#2D2A56] hover:bg-slate-100"><Menu className="h-5 w-5" /></button>
        </div>
        <div>
          <h1 className="font-serif-mct text-xl font-bold text-[#2D2A56]">Drive</h1>
          <p className="text-xs text-[#5A5A7A]">Arborescence des documents (lecture seule)</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/30">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[#5A5A7A]">
          <button
            onClick={() => setPath("")}
            disabled={!path}
            title="Revenir à la racine du Drive"
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition ${
              path
                ? "bg-slate-100 hover:bg-[#EA5B2D] hover:text-white text-[#2D2A56] cursor-pointer"
                : "bg-[#EA5B2D]/10 text-[#EA5B2D] cursor-default"
            }`}
          >
            <Home className="h-3.5 w-3.5" />
            <span>Racine</span>
          </button>
          {segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <button
                onClick={() => setPath(segments.slice(0, i + 1).join("/"))}
                className="rounded-xl px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#2D2A56] font-bold transition cursor-pointer"
              >
                {seg}
              </button>
            </span>
          ))}
        </div>

        {loading ? (
          <SkeletonGrid count={9} className="max-w-[1400px] mx-auto" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-[1400px] mx-auto">
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setPath(path ? `${path}/${f.name}` : f.name)}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 text-left text-sm hover:border-[#EA5B2D]/40 hover:bg-[#EA5B2D]/5 transition-all duration-200 shadow-sm cursor-pointer"
              >
                <Folder className="h-5 w-5 shrink-0 text-[#EA5B2D]" />
                <span className="truncate font-bold text-[#2D2A56]">{f.name}</span>
              </button>
            ))}
            {files.map((f) => (
              <a
                key={f.id}
                href={`https://drive.google.com/file/d/${f.id}/view`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 text-sm hover:border-[#2D2A56]/40 hover:bg-slate-50 transition-all duration-200 shadow-sm"
              >
                <FileText className="h-5 w-5 shrink-0 text-slate-400" />
                <span className="truncate text-[#1A1A1A] font-semibold">{f.name}</span>
              </a>
            ))}
            {folders.length === 0 && files.length === 0 && (
              <div className="col-span-full mx-auto max-w-md text-center py-12 px-4">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
                  <Folder className="h-8 w-8" />
                </div>

                <h3 className="font-serif-mct text-lg font-bold text-[#2D2A56]">
                  Dossier vide
                </h3>
                <p className="mt-2 text-xs text-[#5A5A7A] leading-relaxed max-w-xs mx-auto">
                  Ce dossier ne contient aucun document ou sous-dossier pour le moment.
                </p>

                {/* Nice card/div below the empty state statement */}
                <div className="group mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-[#EA5B2D]/20 hover:shadow-[0_20px_45px_rgba(234,91,45,0.08)] transition-all duration-300 text-left relative">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Documents synchronisés</span>
                    <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-[#EA5B2D]">
                      Lecture seule
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5A5A7A] leading-relaxed">
                    Les pièces justificatives de vos dossiers (Kbis, attestations d'assurances, etc.) 
                    sont importées et organisées de façon structurée. Elles sont accessibles en consultation seule.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
