// Documents feature — public hook. Action-only OCR/classification preview.

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { analyzeDocument, fileToBase64 } from "./api";
import { type AnalyzeResult } from "./types";

export function useDocuments() {
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const analyze = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const content_base64 = await fileToBase64(file);
      const res = await analyzeDocument({ filename: file.name, content_base64 });
      if (mountedRef.current) setResult(res);
      return res;
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Analyse impossible");
      throw err;
    } finally {
      if (mountedRef.current) setIsAnalyzing(false);
    }
  }, []);

  return { result, isAnalyzing, error, analyze };
}
