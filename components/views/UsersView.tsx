"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, UserPlus, AlertCircle, Check, Users, Trash2, ShieldCheck, Eye, X } from "lucide-react";
import { ApiError } from "@/lib/api";
import { useUsersContext, type AppUser } from "@/lib/features/users";
import { useRole } from "@/lib/features/auth/RoleProvider";
import { useDialog } from "@/components/ui/DialogProvider";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

const ROLES = [
  { value: "operateur", label: "Opérateur", desc: "Accès complet — lecture + écriture, gestion des utilisateurs" },
  { value: "direction", label: "Direction", desc: "Lecture seule — consultation des dossiers et statistiques" }
] as const;

const ROLE_LABEL: Record<string, string> = { operateur: "Opérateur", direction: "Direction" };
const initials = (email: string | null) => (email ? email.slice(0, 2).toUpperCase() : "??");
const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

interface UsersViewProps {
  setMobileMenuOpen?: (open: boolean) => void;
  /** Render just the body (no page header / scroll wrapper) — for the Paramètres tabs. */
  embedded?: boolean;
}

export default function UsersView({ setMobileMenuOpen, embedded }: UsersViewProps) {
  const { invite, users, isLoading, status: listStatus, error, ensureLoaded, remove } = useUsersContext();
  const { canWrite } = useRole(); // inviting/removing users is operateur-only on the backend
  const { confirm } = useDialog();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("operateur");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);

  const openInvite = () => { setEmail(""); setRole("operateur"); setInviteOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await invite({ email: email.trim(), role });
      toast.success(`Invitation envoyée à ${res.email} — rôle : ${role}.`);
      setInviteOpen(false);
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

  const handleRemove = async (u: AppUser) => {
    const ok = await confirm({
      title: "Retirer cet accès ?",
      message: `${u.email ?? "Cet utilisateur"} ne pourra plus se connecter à l'application. Cette action est définitive.`,
      confirmLabel: "Retirer l'accès",
      cancelLabel: "Annuler",
      danger: true,
    });
    if (!ok) return;
    setRemovingId(u.id);
    try {
      await remove(u.id);
      toast.success(`Accès retiré pour ${u.email ?? "l'utilisateur"}.`);
    } catch (err) {
      toast.error((err as Error).message || "Échec du retrait de l'accès.");
    } finally {
      setRemovingId(null);
    }
  };

  const userColumns: DataTableColumn<AppUser>[] = [
    {
      id: "user",
      header: "Utilisateur",
      width: "minmax(240px,2fr)",
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#332151]/10 text-[11px] font-bold text-[#332151]">
            {initials(u.email)}
          </span>
          <p className="truncate text-sm font-semibold text-[#332151]">{u.email ?? "—"}</p>
        </div>
      ),
    },
    {
      id: "role",
      header: "Rôle",
      width: "minmax(130px,0.8fr)",
      cell: (u) => {
        if (!u.role) return <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">Non défini</span>;
        const isDirection = u.role === "direction";
        return (
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${isDirection ? "bg-indigo-50 text-[#332151]" : "bg-[#E34F2D]/10 text-[#E34F2D]"}`}>
            {isDirection ? <Eye className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
            {ROLE_LABEL[u.role] ?? u.role}
          </span>
        );
      },
    },
    {
      id: "created_at",
      header: "Ajouté le",
      width: "minmax(120px,0.7fr)",
      cell: (u) => <span className="whitespace-nowrap text-xs font-medium text-slate-500 tabular-nums">{fmtDate(u.created_at)}</span>,
    },
    ...(canWrite
      ? [{
          id: "actions",
          header: "",
          width: "64px",
          align: "right" as const,
          cell: (u: AppUser) => (
            <button
              onClick={() => handleRemove(u)}
              disabled={removingId === u.id}
              title="Retirer l'accès"
              aria-label="Retirer l'accès"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#DF3714] transition-colors hover:border-[#DF3714]/30 hover:bg-[#DF3714]/5 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ),
        } as DataTableColumn<AppUser>]
      : []),
  ];

  return (
    <>
      {/* Header (hidden when embedded under the Paramètres tabs) */}
      {!embedded && (
        <header className="border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur lg:px-6">
          <div className="mb-3 flex items-center justify-between md:hidden">
            <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
            <button onClick={() => setMobileMenuOpen?.(true)} className="rounded-lg p-2 text-[#332151] hover:bg-slate-100">
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <div>
            <h1 className="font-serif-mct text-base sm:text-xl font-bold text-[#332151]">Utilisateurs</h1>
            <p className="text-xs text-[#5A5A7A]">Gérer les accès et les rôles de l&apos;équipe</p>
          </div>
        </header>
      )}

      <div className={embedded ? "" : "flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/30"}>
        <div className="mx-auto w-full max-w-[1100px]">
          {/* User directory — full-width table with an invite action in the header. */}
          <div className="overflow-hidden rounded-3xl border border-slate-100/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-[#332151]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-serif-mct text-base font-bold text-[#332151]">Utilisateurs avec accès</h2>
                  <p className="text-[11px] text-[#5A5A7A]">{users.length} compte{users.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              {canWrite && (
                <button
                  onClick={openInvite}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#E34F2D] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(234,91,45,0.15)] transition-all hover:bg-[#DF3714] active:scale-95"
                >
                  <UserPlus className="h-4 w-4" /> Inviter un utilisateur
                </button>
              )}
            </div>

            {isLoading && users.length === 0 ? (
              <div className="p-4"><SkeletonTable rows={4} cols={3} /></div>
            ) : listStatus === "error" ? (
              <div className="m-4 rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3 text-xs font-semibold text-rose-600">{error}</div>
            ) : (
              <div className="p-4 sm:p-5">
                <DataTable<AppUser>
                  data={users}
                  getRowId={(u) => u.id}
                  columns={userColumns}
                  minWidth="640px"
                  hideToolbar
                  bare
                  emptyMessage="Aucun utilisateur."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite popup */}
      <AnimatePresence>
        {inviteOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#332151]/30 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInviteOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E34F2D]/10 text-[#E34F2D]">
                    <UserPlus className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-serif-mct text-base font-bold text-[#332151]">Nouvel utilisateur</h3>
                    <p className="text-[11px] text-[#5A5A7A]">Un lien de définition de mot de passe lui sera envoyé par email.</p>
                  </div>
                </div>
                <button onClick={() => setInviteOpen(false)} aria-label="Fermer" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#332151]">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Email</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prenom.nom@moncontroletechnique.fr"
                    className="w-full rounded-xl border border-slate-200/70 bg-slate-50 focus:bg-white px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-all shadow-sm focus:border-[#E34F2D] focus:ring-2 focus:ring-[#E34F2D]/20"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">Rôle</label>
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
                          <p className={`mt-1 text-[11px] leading-snug ${active ? "text-[#5A5A7A]" : "text-slate-400"}`}>{r.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!canWrite && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-slate-100 px-4 py-3 text-xs font-bold leading-relaxed text-[#5A5A7A]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Accès en lecture seule — seuls les opérateurs peuvent inviter des utilisateurs.</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setInviteOpen(false)} className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#5A5A7A] transition-colors hover:bg-slate-100">
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={status === "loading" || !canWrite || !email.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#E34F2D] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(234,91,45,0.15)] transition-all hover:bg-[#DF3714] active:scale-95 disabled:opacity-60"
                  >
                    {status === "loading" ? <span>Création…</span> : <><UserPlus className="h-4 w-4" /> Inviter l&apos;utilisateur</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
