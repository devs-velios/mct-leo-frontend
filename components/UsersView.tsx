"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Menu, UserPlus, AlertCircle, Check } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useUsersContext } from "@/lib/features/users";
import { useRole } from "@/lib/features/auth/RoleProvider";

const ROLES = [
  { value: "operateur", label: "Opérateur", desc: "Accès complet — lecture + écriture, gestion des utilisateurs" },
  { value: "direction", label: "Direction", desc: "Lecture seule — consultation des dossiers et statistiques" }
] as const;

interface UsersViewProps {
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function UsersView({ setMobileMenuOpen }: UsersViewProps) {
  const { invite } = useUsersContext();
  const { canWrite } = useRole(); // inviting users is operateur-only on the backend
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("operateur");
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await invite({ email: email.trim(), role });
      toast.success(`Invitation envoyée à ${res.email} — rôle : ${role}.`);
      setEmail("");
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        e.status === 409
          ? "Cet email possède déjà un compte."
          : e.status === 502
            ? "Invitation impossible : l'envoi d'email (SMTP) n'est pas configuré dans Supabase."
            : e.message || "Échec de la création de l'utilisateur."
      );
    } finally {
      setStatus("idle");
    }
  };

  return (
    <>
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur lg:px-6">
        <div className="mb-2 flex items-center justify-between md:hidden">
          <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
          <button onClick={() => setMobileMenuOpen?.(true)} className="rounded-lg p-2 text-[#332151] hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div>
          <h1 className="font-serif-mct text-xl font-bold text-[#332151]">Utilisateurs</h1>
          <p className="text-xs text-[#5A5A7A]">Inviter un membre de l&apos;équipe et définir son rôle</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/30">
        <div className="mx-auto max-w-xl">
          <form
            onSubmit={handleSubmit}
            className="group relative overflow-hidden rounded-3xl border border-slate-100/80 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-[#E34F2D]/20 hover:shadow-[0_20px_45px_rgba(234,91,45,0.08)] transition-all duration-200 lg:p-8"
          >
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 shadow-sm bg-orange-50/50 text-[#E34F2D] shrink-0">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif-mct text-lg font-bold text-[#332151]">Nouvel utilisateur</h2>
                <p className="text-xs text-[#5A5A7A]">Un lien de définition de mot de passe lui sera envoyé par email.</p>
              </div>
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@moncontroletechnique.fr"
                className="w-full rounded-xl border border-slate-200/70 bg-slate-50 focus:bg-white px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-all shadow-sm focus:border-[#E34F2D] focus:ring-2 focus:ring-[#E34F2D]/20"
              />
            </div>

            {/* Role */}
            <div className="mb-6">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                Rôle
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {ROLES.map((r) => {
                  const active = role === r.value;
                  return (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                        active
                          ? "border-[#E34F2D] bg-[#E34F2D]/5 shadow-[0_4px_12px_rgba(234,91,45,0.05)] ring-2 ring-[#E34F2D]/25"
                          : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#332151]">{r.label}</span>
                        {active && <Check className="h-4 w-4 text-[#E34F2D]" />}
                      </div>
                      <p className={`mt-1 text-[11px] leading-snug ${active ? "text-[#5A5A7A]" : "text-slate-400"}`}>
                        {r.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {!canWrite && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-slate-100 px-4 py-3 text-xs font-bold leading-relaxed text-[#5A5A7A]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Accès en lecture seule — seuls les opérateurs peuvent inviter des utilisateurs.</span>
              </div>
            )}
            <button
              type="submit"
              disabled={status === "loading" || !canWrite}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E34F2D] hover:bg-[#DF3714] px-4 py-3 text-sm font-bold text-white transition-all cursor-pointer shadow-[0_4px_12px_rgba(234,91,45,0.15)] active:scale-95 disabled:opacity-60"
            >
              {status === "loading" ? (
                <span>Création…</span>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> <span>Inviter l&apos;utilisateur</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
