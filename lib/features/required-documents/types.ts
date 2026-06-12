// Required documents feature — shared types. Mirrors /api/required-documents.
// The global document checklist (same set for every centre): a document's display
// name (doc_label), its canonical key (doc_key), and an OCR description fed to the
// classifier so the type is recognized on inbound files.

export interface RequiredDocument {
  id: string;
  doc_key: string; // canonical slug, e.g. "kbis"
  doc_label: string; // human label, e.g. "Extrait Kbis"
  description: string | null; // fed to the OCR classifier
}

export interface RequiredDocumentsListResponse {
  documents: RequiredDocument[];
  count: number;
}

export interface CreateRequiredDocumentPayload {
  doc_label: string;
  doc_key?: string; // defaults to a slug of doc_label
  description?: string; // defaults to doc_label
}

export interface UpdateRequiredDocumentPayload {
  doc_label?: string;
  doc_key?: string;
  description?: string;
}

export interface RequiredDocumentsState {
  list: RequiredDocument[];
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
}
