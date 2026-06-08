"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu, Plus, Search, ArrowRight } from "lucide-react";
import {
  useCentresContext,
  type CentreListItem,
  type CreateCentrePayload,
} from "@/lib/features/centres";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateCentreModal, { type CentreFormValues } from "./centres/CreateCentreModal";

// statut_ouverture → display + tone.
const STATUT: Record<string, { label: string; cls: string }> = {
  onboarding: { label: "Onboarding", cls: "bg-slate-100 text-slate-600" },
  audit: { label: "Audit initial", cls: "bg-amber-50 text-amber-700" },
  agrement_en_cours: { label: "Agrément en cours", cls: "bg-amber-50 text-amber-700" },
  ouvert: { label: "Ouvert", cls: "bg-emerald-50 text-emerald-700" },
  bloque: { label: "Bloqué", cls: "bg-rose-50 text-rose-700" },
};

const FILTERS = [
  { key: "tous", label: "Tous", match: () => true },
  { key: "onboarding", label: "Onboarding", match: (s: string) => s === "onboarding" },
  { key: "audit", label: "Audit initial", match: (s: string) => s === "audit" },
  { key: "agrement", label: "Agrément", match: (s: string) => s === "agrement_en_cours" },
  { key: "ouvert", label: "Ouvert", match: (s: string) => s === "ouvert" },
  { key: "bloque", label: "Bloqué", match: (s: string) => s === "bloque" },
] as const;

interface CentresViewProps {
  setMobileMenuOpen?: (open: boolean) => void;
  onOpenDossier?: (id: string) => void;
}

function contactsOf(v: CentreFormValues): Record<string, string> {
  const c: Record<string, string> = {};
  if (v.responsable.trim()) c.responsable = v.responsable.trim();
  if (v.phone.trim()) c.phone = v.phone.trim();
  if (v.email.trim()) c.email = v.email.trim();
  return c;
}

export default function CentresView({ setMobileMenuOpen, onOpenDossier }: CentresViewProps) {
  const { centres, isListLoading, ensureList, create } = useCentresContext();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("tous");

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => { ensureList({ limit: 200 }); }, [ensureList]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FILTERS) c[f.key] = centres.filter((x) => f.match(x.statut_ouverture)).length;
    return c;
  }, [centres]);

  const rows = useMemo(() => {
    const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
    const q = search.trim().toLowerCase();
    return centres.filter((c) => {
      if (!active.match(c.statut_ouverture)) return false;
      if (!q) return true;
      return [c.code_centre, c.enseigne, c.ville].some((x) => (x ?? "").toLowerCase().includes(q));
    });
  }, [centres, filter, search]);

  // ── Create only — all editing/deletion lives on the dossier page ──────────────
  const openCreate = () => {
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (v: CentreFormValues) => {
    setSubmitting(true);
    setFormError(null);
    const payload = {
      code_centre: v.code_centre.trim(),
      enseigne: v.enseigne.trim() || undefined,
      ville: v.ville.trim() || undefined,
      type_contrat: v.type_contrat,
      activites: v.activites,
      street: v.street.trim() || undefined,
      street2: v.street2.trim() || undefined,
      zip: v.zip.trim() || undefined,
      region: v.region.trim() || undefined,
      country: v.country.trim() || undefined,
      contacts_clients: contactsOf(v),
    };
    try {
      await create(payload as CreateCentrePayload);
      setModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F5F7]">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 bg-white border-b border-slate-100 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold font-serif-mct text-[#2D2A56] tracking-tight">Centres Agréés</h2>
            <p className="text-xs text-[#5A5A7A] mt-0.5">Sélectionnez un centre pour ouvrir son dossier — suivi, pièces, relances et conformité.</p>
          </div>
          <button onClick={() => setMobileMenuOpen?.(true)} className="shrink-0 rounded-lg p-2 text-[#2D2A56] hover:bg-slate-100 md:hidden" aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button>
        </div>
        <Button onClick={openCreate} className="gap-1.5 text-xs font-bold self-start">
          <Plus className="h-4 w-4" /> Créer un centre
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
        <div className="max-w-[1500px] mx-auto space-y-6">
          {/* Search + filters */}
          <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par code, enseigne, ville..."
                className="w-full rounded-xl bg-slate-50 border border-slate-200/60 pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:border-[#2D2A56] focus:bg-white transition-all"
              />
            </div>
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="flex-wrap">
                {FILTERS.map((f) => (
                  <TabsTrigger key={f.key} value={f.key}>
                    {f.label}
                    <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[9px] font-black text-[#2D2A56]">{counts[f.key]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Table — basic info + open-dossier launcher */}
          {isListLoading && centres.length === 0 ? (
            <SkeletonTable rows={6} cols={6} />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
              <Table className="min-w-[760px]">
                <TableHeader className="bg-slate-50/70">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-5">Centre</TableHead>
                    <TableHead className="w-[180px] px-3">Activités</TableHead>
                    <TableHead className="w-[150px] px-3">Statut</TableHead>
                    <TableHead className="w-[180px] px-5 text-right">Dossier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c: CentreListItem) => {
                    const st = STATUT[c.statut_ouverture] ?? { label: c.statut_ouverture, cls: "bg-slate-100 text-slate-500" };
                    return (
                      <TableRow key={c.id} className="cursor-pointer group" onClick={() => onOpenDossier?.(c.id)}>
                        {/* Primary: enseigne (title) + merged code · ville */}
                        <TableCell className="px-5">
                          <p className="text-sm font-bold text-[#2D2A56] group-hover:text-[#EA5B2D] transition-colors">{c.enseigne ?? "—"}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            <span className="font-mono">{c.code_centre}</span>
                            {c.ville && <><span className="text-slate-300"> · </span>{c.ville}</>}
                          </p>
                        </TableCell>
                        <TableCell className="w-[180px] px-3 text-[11px] font-semibold text-[#5A5A7A]">
                          {(c.activites ?? []).join(" · ") || "—"}
                        </TableCell>
                        <TableCell className="w-[150px] px-3">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                            {st.label}
                          </span>
                        </TableCell>
                        <TableCell className="w-[180px] px-5">
                          <div className="flex items-center justify-end">
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); onOpenDossier?.(c.id); }}
                              className="gap-1.5 text-[11px] font-bold bg-[#EA5B2D]/10 text-[#EA5B2D] shadow-none hover:bg-[#EA5B2D]/20 hover:text-[#EA5B2D]"
                            >
                              Ouvrir le dossier
                              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rows.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4} className="py-16 text-center text-sm font-semibold text-slate-400">
                        Aucun centre ne correspond à votre recherche.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <CreateCentreModal
        open={modalOpen}
        mode="create"
        submitting={submitting}
        error={formError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
