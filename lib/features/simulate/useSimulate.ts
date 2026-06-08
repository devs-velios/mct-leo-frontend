// Simulate feature — public hook. Action-only (run Odoo deal / client message / document).

"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import { simulateReducer, initialSimulateState } from "./simulateReducer";
import { simulateOdoo, simulateWhatsappMessage, simulateWhatsappDocument } from "./api";
import { type OdooSimulationPayload } from "./types";

export function useSimulate() {
  const [state, dispatch] = useReducer(simulateReducer, initialSimulateState);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const runOdoo = useCallback(async (payload: OdooSimulationPayload) => {
    dispatch({ type: "RUN_START" });
    try {
      const result = await simulateOdoo(payload);
      if (mountedRef.current) dispatch({ type: "RUN_SUCCESS", result });
      return result;
    } catch (err) {
      if (mountedRef.current) {
        dispatch({ type: "RUN_ERROR", error: err instanceof Error ? err.message : "Échec de la création." });
      }
      throw err;
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return {
    status: state.status,
    result: state.result,
    error: state.error,
    runOdoo,
    sendMessage: simulateWhatsappMessage,
    sendDocument: simulateWhatsappDocument,
    reset,
  };
}
