// Documents feature — shared types. Mirrors POST /api/documents/analyze
// (OCR + classification preview; does not upload or persist).

export interface AnalyzePayload {
  filename: string;
  content_base64: string;
}

export interface AnalyzeResult {
  type: string;
  confidence: number;
  reasoning: string;
  targetFolder: string;
  needsReview: boolean;
}
