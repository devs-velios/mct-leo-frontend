// On‑brand replacements for window.confirm / window.prompt. Mounted once (see
// AppProviders); call `useDialog()` anywhere to get Promise-based `confirm()` and
// `prompt()` that render a styled modal instead of the browser's default dialogs.

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

export interface PromptField {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  type?: "text" | "textarea" | "datetime-local";
  required?: boolean;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface PromptOptions {
  title: string;
  message?: string;
  submitLabel?: string;
  cancelLabel?: string;
  fields: PromptField[];
}

interface DialogContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  prompt: (opts: PromptOptions) => Promise<Record<string, string> | null>;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

type ActiveDialog =
  | ({ kind: "confirm"; resolve: (v: boolean) => void } & ConfirmOptions)
  | ({ kind: "prompt"; resolve: (v: Record<string, string> | null) => void } & PromptOptions);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ kind: "confirm", resolve, ...opts });
    });
  }, []);

  const prompt = useCallback((opts: PromptOptions) => {
    return new Promise<Record<string, string> | null>((resolve) => {
      setValues(Object.fromEntries(opts.fields.map((f) => [f.name, f.defaultValue ?? ""])));
      setDialog({ kind: "prompt", resolve, ...opts });
    });
  }, []);

  const close = useCallback(() => setDialog(null), []);

  const cancel = useCallback(() => {
    if (!dialog) return;
    if (dialog.kind === "confirm") dialog.resolve(false);
    else dialog.resolve(null);
    close();
  }, [dialog, close]);

  const accept = useCallback(() => {
    if (!dialog) return;
    if (dialog.kind === "confirm") dialog.resolve(true);
    else dialog.resolve(values);
    close();
  }, [dialog, values, close]);

  // Escape closes; focus the first field on open.
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cancel(); };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [dialog, cancel]);

  const value = useMemo(() => ({ confirm, prompt }), [confirm, prompt]);

  const missingRequired =
    dialog?.kind === "prompt" &&
    dialog.fields.some((f) => f.required && !(values[f.name] ?? "").trim());

  return (
    <DialogContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {dialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
            onMouseDown={(e) => { if (e.target === e.currentTarget) cancel(); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 text-[#1A1A1A] shadow-2xl border border-slate-100"
            >
              <div className="flex items-start justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
                <div className="flex items-start gap-3">
                  {dialog.kind === "confirm" && dialog.danger && (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                  )}
                  <div>
                    <h3 className="text-lg font-extrabold font-serif-mct text-[#332151] leading-snug">{dialog.title}</h3>
                    {dialog.message && <p className="mt-1 text-xs text-[#5A5A7A] leading-relaxed">{dialog.message}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cancel}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-[#5A5A7A] hover:text-[#332151] cursor-pointer transition shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); if (!missingRequired) accept(); }}
                className="space-y-4"
              >
                {dialog.kind === "prompt" &&
                  dialog.fields.map((f, idx) => (
                    <div key={f.name}>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A]">
                        {f.label}
                      </label>
                      {f.type === "textarea" ? (
                        <textarea
                          ref={idx === 0 ? (el) => { firstFieldRef.current = el; } : undefined}
                          rows={3}
                          value={values[f.name] ?? ""}
                          placeholder={f.placeholder}
                          onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                          className="w-full rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-[#E34F2D] focus:bg-white transition-all shadow-sm resize-none"
                        />
                      ) : (
                        <input
                          ref={idx === 0 ? (el) => { firstFieldRef.current = el; } : undefined}
                          type={f.type ?? "text"}
                          value={values[f.name] ?? ""}
                          placeholder={f.placeholder}
                          onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                          className="w-full rounded-xl bg-slate-50 border border-slate-200/70 px-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-[#E34F2D] focus:bg-white transition-all shadow-sm"
                        />
                      )}
                    </div>
                  ))}

                <div className="pt-4 flex gap-3 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={cancel}
                    className="flex-1 py-3 text-xs font-extrabold rounded-xl border border-slate-200 text-[#5A5A7A] hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {dialog.cancelLabel ?? "Annuler"}
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(missingRequired)}
                    className={`flex-1 py-3 text-xs font-extrabold rounded-xl text-white transition-colors cursor-pointer disabled:opacity-50 shadow-sm ${
                      dialog.kind === "confirm" && dialog.danger
                        ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                        : "bg-[#E34F2D] hover:bg-[#DF3714] shadow-[#E34F2D]/20"
                    }`}
                  >
                    {dialog.kind === "confirm" ? dialog.confirmLabel ?? "Confirmer" : dialog.submitLabel ?? "Enregistrer"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within a DialogProvider");
  return ctx;
}
