// Folders feature — canonical Drive folder taxonomy + the destination-picker
// resolution (configured folders → live Drive root → hardcoded fallback). Kept
// here so the Validations "Déplacer" picker stays presentational.

import { type Folder } from "./types";

// Canonical Drive folders — last-resort fallback for the "Déplacer" picker.
export const DEFAULT_FOLDERS = [
  "02_Administratif",
  "03_Plans",
  "04_Controleurs",
  "05_Engagements",
  "06_Agrements",
  "07_Studio",
  "99_A_identifier",
];

// User-friendly French names (the dropdown hides the technical "NN_" folder codes).
const FOLDER_LABELS: Record<string, string> = {
  "02_Administratif": "Administratif",
  "03_Plans": "Plans",
  "04_Controleurs": "Contrôleurs",
  "05_Engagements": "Engagements",
  "06_Agrements": "Agréments",
  "07_Studio": "Studio",
  "99_A_identifier": "À identifier",
};

/** Friendly label for a folder: known mapping, else strip the leading code + underscores. */
export function friendlyFolder(name: string, label?: string | null): string {
  if (FOLDER_LABELS[name]) return FOLDER_LABELS[name];
  const base = (label && label.trim()) || name;
  return base.replace(/^\d+[\s_-]*/, "").replace(/_/g, " ").trim() || name;
}

export interface FolderOption { value: string; label: string; }

/**
 * Destination folder options for moving a piece, by priority:
 *  1. Configured routing folders (sorted by sort_order), when any are set up.
 *  2. The live Drive root folders (the real directories that exist).
 *  3. Canonical hardcoded list — last-resort fallback only.
 */
export function destinationFolderOptions(
  configured: Folder[],
  driveFolders: { name: string }[],
): FolderOption[] {
  const fromConfig = [...configured]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((f) => ({ value: f.name, label: friendlyFolder(f.name, f.label) }));
  if (fromConfig.length > 0) return fromConfig;

  const fromDrive = driveFolders.map((f) => ({ value: f.name, label: friendlyFolder(f.name) }));
  if (fromDrive.length > 0) return fromDrive;

  return DEFAULT_FOLDERS.map((n) => ({ value: n, label: friendlyFolder(n) }));
}
