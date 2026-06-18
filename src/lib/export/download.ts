import { saveAs } from "file-saver";

export function downloadBlob(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

/** Filesystem-safe filename fragment, e.g. for club/team names embedded in a report's filename. */
export function slug(value: string) {
  return value.trim().replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").slice(0, 60);
}
