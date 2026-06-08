// Assistant feature — public hook. Caches the chat thread so it survives navigation.

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { assistantReducer, initialAssistantState } from "./assistantReducer";
import { askRag } from "./api";

export function useAssistant() {
  const [state, dispatch] = useReducer(assistantReducer, initialAssistantState);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const ask = useCallback(async (question: string, lang: "fr" | "en" = "fr") => {
    const q = question.trim();
    if (!q) return;
    dispatch({ type: "ADD_USER", text: q });
    try {
      const response = await askRag({ question: q, lang });
      if (mountedRef.current) dispatch({ type: "ASK_SUCCESS", response });
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "ASK_ERROR", error: err instanceof Error ? err.message : "Request failed" });
      }
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    messages: state.messages,
    status: state.status,
    error: state.error,
    isLoading: state.status === "loading",
    ask,
    reset,
  };
}
