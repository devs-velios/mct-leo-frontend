"use client";

import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ShieldCheck, XCircle, FileCheck2 } from "lucide-react";
import { Panel, EmptyState } from "./Panel";
import { usePiecesContext, queueItemToValidation, pieceTypeLabel } from "@/lib/features/pieces";
import { useDialog } from "@/components/ui/DialogProvider";
import { Button } from "@/components/ui/button";
import { CentreCell } from "@/components/ui/centre-cell";

const notify = (msg: string) => (/échec|erreur/i.test(msg) ? toast.error(msg) : toast.success(msg));

export default function DocsToValidateTable() {
  const { queue, ensureQueue, verify, reject } = usePiecesContext();
  const { confirm, prompt } = useDialog();

  useEffect(() => { ensureQueue(); }, [ensureQueue]);

  // Most-recent pending pieces awaiting a human decision.
  const rows = useMemo(
    () =>
      queue
        .map(queueItemToValidation)
        .filter((v) => v.status === "À valider" || v.status === "À identifier")
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        .slice(0, 6),
    [queue],
  );

  const onValidate = async (pieceId: string | undefined, docType: string, code: string) => {
    if (!pieceId) return;
    const ok = await confirm({
      title: `Valider « ${pieceTypeLabel(docType)} » ?`,
      message: `La pièce de ${code} sera marquée comme validée et le client en sera informé.`,
      confirmLabel: "Valider",
    });
    if (!ok) return;
    try { await verify(pieceId); notify(`Pièce « ${pieceTypeLabel(docType)} » validée.`); }
    catch { notify(`Échec de la validation de ${code}.`); }
  };

  const onReject = async (pieceId: string | undefined, code: string) => {
    if (!pieceId) return;
    const res = await prompt({
      title: "Rejeter la pièce",
      submitLabel: "Rejeter",
      fields: [{ name: "reason", label: "Motif du rejet", required: true }],
    });
    if (!res) return;
    try { await reject(pieceId, res.reason); notify(`Pièce de ${code} rejetée.`); }
    catch { notify(`Échec du rejet de ${code}.`); }
  };

  return (
    <Panel title="Derniers documents à valider" subtitle="Pièces en attente d'une décision humaine">
      {rows.length === 0 ? (
        <EmptyState icon={FileCheck2} message="Aucun document à valider" hint="Tout est à jour 🎉" />
      ) : (
        <div className="flex flex-col divide-y divide-slate-50">
          {rows.map((v) => (
            <div key={v.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#332151]">{pieceTypeLabel(v.docType)}</p>
                <div className="mt-0.5 scale-90 origin-left"><CentreCell name={v.nom} code={v.code} /></div>
              </div>
              <span
                className={`hidden w-12 shrink-0 text-right text-xs font-bold tabular-nums sm:block ${
                  v.confIA >= 90 ? "text-emerald-600" : v.confIA < 70 ? "text-[#E11D48]" : "text-[#5A5A7A]"
                }`}
                title="Confiance IA"
              >
                {v.confIA}%
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  title="Valider"
                  onClick={() => onValidate(v.pieceId, v.docType, v.code)}
                  className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-emerald-600"
                >
                  <ShieldCheck className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  title="Rejeter"
                  onClick={() => onReject(v.pieceId, v.code)}
                  className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
