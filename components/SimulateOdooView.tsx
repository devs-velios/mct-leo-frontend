"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Menu, Zap, ArrowRight, Shuffle } from "lucide-react";
import { useSimulateContext } from "@/lib/features/simulate";
import { useDashboardContext } from "@/lib/features/dashboard";
import { useCentresContext } from "@/lib/features/centres";
import { useDossiersContext } from "@/lib/features/dossiers";

interface OdooPayload {
  contract_id: string;
  code_centre: string;
  type: "R" | "P";
  activities: string[];
  enseigne: string;
  phone: string;
  zip: string;
  city: string;
  region: string;
}

// Prebuilt scenarios (each produces a different WhatsApp group roster — see frontend-simulation.md)
const PRESETS: { label: string; hint: string; payload: OdooPayload }[] = [
  { label: "Lyon (69) · VL · R", hint: "Jennifer + Thierry + Anthony", payload: { contract_id: "SO-69R", code_centre: "CT-LYON-VL", type: "R", activities: ["VL"], enseigne: "Garage du Lac", phone: "33600000069", zip: "69003", city: "Lyon", region: "Rhône" } },
  { label: "Paris (75) · VL+CL · P", hint: "Emmanuel + Fabrice (sans Anthony)", payload: { contract_id: "SO-75P", code_centre: "CT-PARIS-VLCL", type: "P", activities: ["VL", "CL"], enseigne: "CT Paris 11", phone: "33600000075", zip: "75011", city: "Paris", region: "Île-de-France" } },
  { label: "Toulouse (31) · PL · R", hint: "Hicham + Laurent + Anthony", payload: { contract_id: "SO-31R", code_centre: "CT-TLSE-PL", type: "R", activities: ["PL"], enseigne: "Poids Lourds 31", phone: "33600000031", zip: "31000", city: "Toulouse", region: "Occitanie" } },
  { label: "Marseille (13) · VL+CL+PL · R", hint: "Jennifer + Saber + Anthony", payload: { contract_id: "SO-13R", code_centre: "CT-MRS-ALL", type: "R", activities: ["VL", "CL", "PL"], enseigne: "CT Marseille", phone: "33600000013", zip: "13001", city: "Marseille", region: "PACA" } },
  { label: "Nantes (44) · VL · R", hint: "Emmanuel + Mickaël + Anthony", payload: { contract_id: "SO-44R", code_centre: "CT-NANTES-VL", type: "R", activities: ["VL"], enseigne: "Garage Atlantique", phone: "33600000044", zip: "44000", city: "Nantes", region: "Pays de la Loire" } }
];

const EMPTY: OdooPayload = { contract_id: "", code_centre: "", type: "R", activities: ["VL"], enseigne: "", phone: "", zip: "", city: "", region: "" };

// ── Random-but-meaningful data for the "Aléatoire" generator ───────────────────
const CITIES = [
  { city: "Lyon", zip: "69003", region: "Auvergne-Rhône-Alpes", code: "LYON" },
  { city: "Paris", zip: "75011", region: "Île-de-France", code: "PARIS" },
  { city: "Toulouse", zip: "31000", region: "Occitanie", code: "TLSE" },
  { city: "Marseille", zip: "13001", region: "Provence-Alpes-Côte d'Azur", code: "MRS" },
  { city: "Nantes", zip: "44000", region: "Pays de la Loire", code: "NANTES" },
  { city: "Bordeaux", zip: "33000", region: "Nouvelle-Aquitaine", code: "BDX" },
  { city: "Lille", zip: "59000", region: "Hauts-de-France", code: "LILLE" },
  { city: "Strasbourg", zip: "67000", region: "Grand Est", code: "STRAS" },
  { city: "Nice", zip: "06000", region: "Provence-Alpes-Côte d'Azur", code: "NICE" },
  { city: "Rennes", zip: "35000", region: "Bretagne", code: "RENNES" },
  { city: "Montpellier", zip: "34000", region: "Occitanie", code: "MTP" },
  { city: "Dijon", zip: "21000", region: "Bourgogne-Franche-Comté", code: "DIJON" },
  { city: "Grenoble", zip: "38000", region: "Auvergne-Rhône-Alpes", code: "GRBL" },
  { city: "Angers", zip: "49000", region: "Pays de la Loire", code: "ANGERS" },
  { city: "Le Mans", zip: "72000", region: "Pays de la Loire", code: "LEMANS" },
  { city: "Reims", zip: "51100", region: "Grand Est", code: "REIMS" },
  { city: "Saint-Étienne", zip: "42000", region: "Auvergne-Rhône-Alpes", code: "STET" },
  { city: "Toulon", zip: "83000", region: "Provence-Alpes-Côte d'Azur", code: "TLON" },
  { city: "Le Havre", zip: "76600", region: "Normandie", code: "LEHAVRE" },
  { city: "Clermont-Ferrand", zip: "63000", region: "Auvergne-Rhône-Alpes", code: "CLERM" },
  { city: "Brest", zip: "29200", region: "Bretagne", code: "BREST" },
  { city: "Limoges", zip: "87000", region: "Nouvelle-Aquitaine", code: "LIMOG" },
  { city: "Amiens", zip: "80000", region: "Hauts-de-France", code: "AMIENS" },
  { city: "Tours", zip: "37000", region: "Centre-Val de Loire", code: "TOURS" },
  { city: "Metz", zip: "57000", region: "Grand Est", code: "METZ" },
  { city: "Besançon", zip: "25000", region: "Bourgogne-Franche-Comté", code: "BESAN" },
  { city: "Orléans", zip: "45000", region: "Centre-Val de Loire", code: "ORLE" },
  { city: "Mulhouse", zip: "68100", region: "Grand Est", code: "MULH" },
  { city: "Caen", zip: "14000", region: "Normandie", code: "CAEN" },
  { city: "Nancy", zip: "54000", region: "Grand Est", code: "NANCY" },
  { city: "Rouen", zip: "76000", region: "Normandie", code: "ROUEN" },
  { city: "Avignon", zip: "84000", region: "Provence-Alpes-Côte d'Azur", code: "AVIGN" },
  { city: "Poitiers", zip: "86000", region: "Nouvelle-Aquitaine", code: "POIT" },
  { city: "Nîmes", zip: "30000", region: "Occitanie", code: "NIMES" },
  { city: "Pau", zip: "64000", region: "Nouvelle-Aquitaine", code: "PAU" },
  { city: "La Rochelle", zip: "17000", region: "Nouvelle-Aquitaine", code: "LAROCH" },
  { city: "Annecy", zip: "74000", region: "Auvergne-Rhône-Alpes", code: "ANNECY" },
  { city: "Perpignan", zip: "66000", region: "Occitanie", code: "PERP" },
  { city: "Bayonne", zip: "64100", region: "Nouvelle-Aquitaine", code: "BAYON" },
  { city: "Chambéry", zip: "73000", region: "Auvergne-Rhône-Alpes", code: "CHAMB" },
  { city: "Valence", zip: "26000", region: "Auvergne-Rhône-Alpes", code: "VALEN" },
  { city: "Quimper", zip: "29000", region: "Bretagne", code: "QUIMP" },
  { city: "Vannes", zip: "56000", region: "Bretagne", code: "VANNES" },
  { city: "Lorient", zip: "56100", region: "Bretagne", code: "LORIE" },
  { city: "Troyes", zip: "10000", region: "Grand Est", code: "TROYES" },
  { city: "Beauvais", zip: "60000", region: "Hauts-de-France", code: "BEAUV" },
  { city: "Cholet", zip: "49300", region: "Pays de la Loire", code: "CHOLET" },
  { city: "La Roche-sur-Yon", zip: "85000", region: "Pays de la Loire", code: "LRSY" },
  { city: "Niort", zip: "79000", region: "Nouvelle-Aquitaine", code: "NIORT" },
  { city: "Angoulême", zip: "16000", region: "Nouvelle-Aquitaine", code: "ANGOU" },
];
const ENSEIGNES = [
  "Garage du Lac", "CT Express", "Auto Contrôle", "Centre Technique", "Contrôle Auto Plus",
  "Sécurité Auto", "CT du Centre", "Garage Atlantique", "Vérif'Auto", "Mon Contrôle Technique",
  "Autovision", "Sécuritest", "Dekra Auto", "Norauto CT", "Speedy Contrôle", "Feu Vert CT",
  "Contrôle Technique Pro", "AutoSur", "CT Confiance", "Le Contrôle Rapide", "Garage Moderne",
  "Centre Auto Bilan", "CT Premium", "Vérification Auto", "Contrôle Express",
];
const ACTIVITY_SETS = [["VL"], ["PL"], ["CL"], ["VL", "CL"], ["VL", "PL"], ["VL", "CL", "PL"]];
const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Build a unique-but-realistic Odoo payload so every run is a fresh, never-processed centre. */
function randomPayload(): OdooPayload {
  const c = rand(CITIES);
  const activities = rand(ACTIVITY_SETS);
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase(); // 3 chars → keeps contract/centre unique
  const num = Math.floor(1000 + Math.random() * 9000);
  return {
    contract_id: `SO-${num}-${suffix}`,
    code_centre: `CT-${c.code}-${activities[0]}-${suffix}`,
    type: Math.random() < 0.7 ? "R" : "P",
    activities,
    enseigne: rand(ENSEIGNES),
    phone: `336${Math.floor(10000000 + Math.random() * 89999999)}`,
    zip: c.zip,
    city: c.city,
    region: c.region,
  };
}

export default function SimulateOdooView({ setMobileMenuOpen }: { setMobileMenuOpen?: (o: boolean) => void }) {
  const { status, runOdoo, reset } = useSimulateContext();
  const router = useRouter();
  // A simulated centre changes the dashboard KPIs, the centres list and the pipeline,
  // so refresh those shared caches before landing on the dashboard.
  const { refresh: refreshDashboard } = useDashboardContext();
  const { revalidateList: revalidateCentres } = useCentresContext();
  const { revalidate: revalidateDossiers } = useDossiersContext();
  const [form, setForm] = useState<OdooPayload>(EMPTY);

  const set = (k: keyof OdooPayload, v: string | string[]) => setForm((f) => ({ ...f, [k]: v }));
  // Fill the form with unique, realistic values — avoids the "déjà traité" error from re-using presets.
  const generate = () => { setForm(randomPayload()); reset(); };
  const toggleAct = (a: string) =>
    setForm((f) => ({ ...f, activities: f.activities.includes(a) ? f.activities.filter((x) => x !== a) : [...f.activities, a] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contract_id || !form.code_centre) return;
    try {
      await runOdoo(form);
      toast.success("Centre créé ! Groupe WhatsApp + rappel programmés.", { description: form.code_centre });
      // Reload the dashboard's shared data, then navigate there.
      void refreshDashboard();
      void revalidateCentres();
      void revalidateDossiers();
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la création.");
    }
  };

  return (
    <>
      <header className="border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur lg:px-6">
        <div className="mb-3 flex items-center justify-between md:hidden">
          <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
          <button onClick={() => setMobileMenuOpen?.(true)} className="rounded-lg p-2 text-[#332151] hover:bg-slate-100"><Menu className="h-5 w-5" /></button>
        </div>
        <div>
          <h1 className="font-serif-mct text-base sm:text-xl font-bold text-[#332151]">Simulateur Odoo</h1>
          <p className="text-xs text-[#5A5A7A]">Simuler une affaire gagnée → crée le centre + groupe WhatsApp + rappel</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/30">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Presets */}
          <div>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Scénarios prédéfinis</p>
              <button
                type="button"
                onClick={generate}
                title="Remplir avec des valeurs aléatoires (uniques)"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#332151]/15 bg-white px-2.5 py-1 text-[10px] font-bold text-[#332151] transition-colors hover:border-[#E34F2D] hover:text-[#E34F2D] cursor-pointer"
              >
                <Shuffle className="h-3.5 w-3.5" /> Aléatoire
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setForm(p.payload); reset(); }}
                  className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 text-left transition-all duration-200 hover:border-[#E34F2D]/20 hover:shadow-[0_12px_35px_rgba(234,91,45,0.06)] shadow-[0_2px_8px_rgba(0,0,0,0.005)] cursor-pointer"
                >
                  <span className="block text-sm font-bold text-[#332151] group-hover:text-[#E34F2D] transition-colors">{p.label}</span>
                  <span className="text-[11px] text-[#5A5A7A] mt-1.5 block">Groupe : {p.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form (editable / custom) */}
          <form
            onSubmit={submit}
            className="group relative overflow-hidden rounded-3xl border border-slate-100/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-[#E34F2D]/20 hover:shadow-[0_20px_45px_rgba(234,91,45,0.08)] transition-all duration-200 lg:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="N° contrat *" value={form.contract_id} onChange={(v) => set("contract_id", v)} placeholder="SO-1001" />
              <Field label="Code centre *" value={form.code_centre} onChange={(v) => set("code_centre", v)} placeholder="CT-DEMO-1" />
              <Field label="Enseigne" value={form.enseigne} onChange={(v) => set("enseigne", v)} placeholder="Garage du Lac" />
              <Field label="Téléphone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="33600000000" />
              <Field label="Code postal" value={form.zip} onChange={(v) => set("zip", v)} placeholder="69003" />
              <Field label="Ville" value={form.city} onChange={(v) => set("city", v)} placeholder="Lyon" />
              <Field label="Région" value={form.region} onChange={(v) => set("region", v)} placeholder="Rhône" />
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Type contrat</label>
                <div className="flex gap-2">
                  {(["R", "P"] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => set("type", t)}
                      className={`flex-1 rounded-xl border py-3 text-xs font-extrabold transition-all cursor-pointer ${
                        form.type === t
                          ? "border-[#E34F2D] bg-[#E34F2D]/5 text-[#E34F2D] ring-2 ring-[#E34F2D]/25 shadow-sm"
                          : "border-slate-200 text-[#5A5A7A] hover:bg-slate-50/50 hover:border-slate-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Activités</label>
              <div className="flex gap-2">
                {["VL", "CL", "PL"].map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleAct(a)}
                    className={`rounded-xl border px-5 py-3 text-xs font-extrabold transition-all cursor-pointer ${
                      form.activities.includes(a)
                        ? "border-[#E34F2D] bg-[#E34F2D]/5 text-[#E34F2D] ring-2 ring-[#E34F2D]/25 shadow-sm"
                        : "border-slate-200 text-[#5A5A7A] hover:bg-slate-50/50 hover:border-slate-300"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E34F2D] hover:bg-[#DF3714] px-4 py-3.5 text-sm font-bold text-white transition-all cursor-pointer shadow-[0_4px_12px_rgba(234,91,45,0.15)] active:scale-95 disabled:opacity-60"
            >
              {status === "loading" ? (
                <span>Création…</span>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> <span>Créer le centre</span> <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200/70 bg-slate-50 focus:bg-white px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-all shadow-sm focus:border-[#E34F2D] focus:ring-2 focus:ring-[#E34F2D]/20"
      />
    </div>
  );
}
