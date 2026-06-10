"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Menu, Send, Sparkles, User } from "lucide-react";
import { useAssistantContext } from "@/lib/features/assistant";
import Markdown from "@/components/ui/Markdown";

interface AssistantViewProps {
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function AssistantView({ setMobileMenuOpen }: AssistantViewProps) {
  const { messages: msgs, isLoading: loading, ask: askAssistant } = useAssistantContext();
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Keep the conversation pinned to the latest message — scroll ONLY the chat
  // container (not the page) so the layout doesn't jump.
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    await askAssistant(q, "fr"); // context appends both turns + caches the thread
  };

  // Memoize the rendered messages so typing in the input doesn't rebuild/re-parse
  // the whole thread (only recompute when the messages actually change).
  const messageList = useMemo(
    () =>
      msgs.map((m, i) => (
        <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === "user" ? "bg-[#332151] text-white" : "bg-[#E34F2D]/10 text-[#E34F2D]"}`}>
            {m.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </div>
          <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${m.role === "user" ? "bg-[#332151] text-white" : "bg-white text-[#1A1A1A] border border-slate-100"}`}>
            {m.role === "leo" ? (
              <Markdown>{m.text}</Markdown>
            ) : (
              <p className="whitespace-pre-wrap">{m.text}</p>
            )}
            {m.needsApproval && (
              <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">⚠️ À valider par un humain avant envoi client</p>
            )}
            {m.sources && m.sources.length > 0 && (
              <div className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-[#5A5A7A]">
                <span className="font-bold">Sources :</span>
                <ul className="mt-1 list-disc pl-4">
                  {m.sources.map((s, j) => <li key={j}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )),
    [msgs],
  );

  return (
    <>
      <header className="border-b border-slate-100 bg-white/80 px-4 py-4 backdrop-blur lg:px-6">
        <div className="mb-3 flex items-center justify-between md:hidden">
          <span className="font-serif-mct text-lg font-bold text-[#332151]">MCT Léo</span>
          <button onClick={() => setMobileMenuOpen?.(true)} className="rounded-lg p-2 text-[#332151] hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <div>
          <h1 className="font-serif-mct text-base sm:text-xl font-bold text-[#332151]">Assistant Léo</h1>
          <p className="text-xs text-[#5A5A7A]">Questions réglementaires — réponses sourcées</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/30">
          <div className="mx-auto max-w-2xl space-y-4">
            {msgs.length === 0 && (
              <div className="mx-auto max-w-md text-center py-12 px-4">
                <div className="relative mb-6 inline-flex items-center justify-center">
                  {/* Outer glowing pulse ring */}
                  <div className="absolute inset-0 rounded-full blur-xl opacity-35 bg-[#E34F2D]/35 animate-pulse" />
                  {/* Inner container */}
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 shadow-sm bg-orange-50/50 text-[#E34F2D]">
                    <Sparkles className="h-8 w-8 animate-pulse" />
                  </div>
                </div>

                <h3 className="font-serif-mct text-lg font-bold text-[#332151]">
                  Assistant réglementaire Léo
                </h3>
                <p className="mt-2 text-xs text-[#5A5A7A] leading-relaxed max-w-xs mx-auto">
                  Posez vos questions concernant la réglementation technique ou la gestion de vos dossiers MCT.
                </p>

                {/* Nice interactive examples card */}
                <div className="group mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:border-[#E34F2D]/20 hover:shadow-[0_20px_45px_rgba(234,91,45,0.08)] transition-all duration-200 text-left relative">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A7A] block border-b border-slate-100 pb-3 mb-3">
                    Exemples de questions (cliquez pour essayer)
                  </span>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setInput("Quels documents pour ouvrir un centre VL ?")}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-[#E34F2D]/20 hover:bg-slate-50/50 transition-all text-xs font-bold text-[#332151] flex justify-between items-center group/btn cursor-pointer"
                    >
                      <span className="truncate pr-4">Quels documents pour ouvrir un centre VL ?</span>
                      <span className="text-[#E34F2D] opacity-0 group-hover/btn:opacity-100 transition-opacity font-bold">→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput("Quelle est la procédure pour un dossier bloqué ?")}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-[#E34F2D]/20 hover:bg-slate-50/50 transition-all text-xs font-bold text-[#332151] flex justify-between items-center group/btn cursor-pointer"
                    >
                      <span className="truncate pr-4">Quelle est la procédure pour un dossier bloqué ?</span>
                      <span className="text-[#E34F2D] opacity-0 group-hover/btn:opacity-100 transition-opacity font-bold">→</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {messageList}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E34F2D]/10 text-[#E34F2D]">
                  <span className="absolute inset-0 rounded-full bg-[#E34F2D]/25 animate-ping" />
                  <Sparkles className="relative h-4 w-4 animate-pulse" />
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md border border-[#E34F2D]/15 bg-white px-4 py-3 shadow-sm">
                  <span className="text-xs font-bold text-[#E34F2D]">Léo réfléchit</span>
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E34F2D] animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E34F2D] animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E34F2D] animate-bounce" />
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <form onSubmit={ask} className="border-t border-slate-100 bg-white p-4">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Votre question…"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white px-4 py-3 text-sm outline-none focus:border-[#E34F2D] focus:ring-2 focus:ring-[#E34F2D]/20 transition-all shadow-sm"
            />
            <button type="submit" disabled={loading} className="rounded-xl bg-[#E34F2D] hover:bg-[#DF3714] p-3 text-white transition cursor-pointer disabled:opacity-50">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
