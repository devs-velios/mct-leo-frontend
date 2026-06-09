"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Menu, FolderPlus, Save, Pencil, RefreshCw } from "lucide-react";
import { useFoldersContext, type Folder } from "@/lib/features/folders";
import { useDialog } from "@/components/ui/DialogProvider";
import Select from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";

export default function FoldersView({ setMobileMenuOpen }: { setMobileMenuOpen?: (o: boolean) => void }) {
  const {
    folders,
    routing,
    isLoading: loading,
    ensureLoaded,
    addFolder: createFolder,
    renameFolder: updateFolder,
    repoint: repointRouting,
    refresh,
  } = useFoldersContext();
  const { prompt } = useDialog();
  const [newName, setNewName] = useState("");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);

  const addFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createFolder({ name: newName.trim(), label: newLabel.trim() || undefined });
      setNewName("");
      setNewLabel("");
      toast.success("Dossier ajouté.");
    } catch {
      toast.error("Impossible d'ajouter ce dossier (nom déjà existant ?).");
    }
  };

  const renameFolder = async (f: Folder) => {
    const res = await prompt({
      title: "Renommer le dossier",
      submitLabel: "Renommer",
      fields: [{ name: "label", label: "Libellé du dossier", defaultValue: f.label ?? f.name, required: true }],
    });
    if (!res) return;
    try {
      await updateFolder(f.id, { label: res.label });
      toast.success("Dossier renommé.");
    } catch {
      toast.error("Échec du renommage.");
    }
  };

  const repoint = async (doc_key: string, folder_name: string) => {
    await repointRouting(doc_key, folder_name).catch(() => {});
  };

  return (
    <>
      <header className="border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur lg:px-6">
        <div className="mb-2 flex items-center justify-between md:hidden">
          <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
          <button onClick={() => setMobileMenuOpen?.(true)} className="rounded-lg p-2 text-[#332151] hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-serif-mct text-xl font-bold text-[#332151]">Dossiers Drive</h1>
            <p className="text-xs text-[#5A5A7A]">Catalogue des dossiers et routage des documents</p>
          </div>
          <button
            onClick={() => refresh()}
            disabled={loading}
            title="Actualiser"
            aria-label="Actualiser"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#5A5A7A] transition-colors hover:border-[#E34F2D]/40 hover:text-[#E34F2D] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/30">
        {loading ? (
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
            {[0, 1].map((col) => (
              <div key={col} className="rounded-3xl border border-slate-100/80 bg-white p-6 space-y-3">
                <Skeleton className="h-5 w-40 mb-4" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-7 w-28 rounded-xl" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
            {/* Folders List Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-slate-100/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-[#E34F2D]/20 hover:shadow-[0_20px_45px_rgba(234,91,45,0.04)] transition-all duration-200">
              <h2 className="mb-4 font-serif-mct text-lg font-bold text-[#332151] flex items-center justify-between">
                <span>Dossiers</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E34F2D] px-2.5 py-0.5 rounded-md bg-orange-50 border border-orange-100/50">
                  {folders.length} configurés
                </span>
              </h2>
              
              <ul className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                {folders.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-sm hover:bg-slate-50/50 transition hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-bold text-[#332151] truncate">{f.label ?? f.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {f.name} {f.is_review ? " · révision" : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => renameFolder(f)}
                      title="Renommer"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#332151] cursor-pointer transition active:scale-90"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Folder Creation Form */}
              <form onSubmit={addFolder} className="mt-6 space-y-4 border-t border-slate-100 pt-5">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                      Nom du dossier
                    </label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ex: 07_Nouveau"
                      className="w-full rounded-xl bg-slate-50 border border-slate-200/70 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#E34F2D] focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                      Libellé
                    </label>
                    <input
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Libellé du dossier"
                      className="w-full rounded-xl bg-slate-50 border border-slate-200/70 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#E34F2D] focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#E34F2D] hover:bg-[#DF3714] px-4 py-2.5 text-xs font-extrabold text-white cursor-pointer transition active:scale-95 shadow-md"
                >
                  <FolderPlus className="h-4 w-4 text-[#E34F2D]" /> Ajouter
                </button>
              </form>
            </div>

            {/* Document Routing Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-slate-100/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-[#E34F2D]/20 hover:shadow-[0_20px_45px_rgba(234,91,45,0.04)] transition-all duration-200">
              <h2 className="mb-4 font-serif-mct text-lg font-bold text-[#332151] flex items-center justify-between">
                <span>Routage des documents</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100/50">
                  Automatisé
                </span>
              </h2>
              
              <div className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
                {routing.map((r) => (
                  <div
                    key={r.doc_key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 px-4 py-3 text-sm hover:bg-slate-50/50 transition hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Save className="h-4 w-4 text-[#E34F2D] shrink-0" />
                      <span className="truncate font-bold text-[#332151]">{r.doc_key}</span>
                    </div>
                    <Select
                      value={r.folder_name}
                      options={folders.map((f) => ({ value: f.name, label: f.name }))}
                      onChange={(v) => repoint(r.doc_key, v)}
                      className="shrink-0 w-full sm:w-44"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
