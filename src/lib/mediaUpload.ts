import { supabase } from "@/integrations/supabase/client";

export const IMAGE_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
export const VIDEO_MIME = ["video/mp4", "video/webm", "video/quicktime"];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_BYTES = 10 * 1024 * 1024; // 10MB (also enforced by storage bucket)

export class MediaError extends Error {}

export function validateFile(file: File, kind: "image" | "video") {
  const allowed = kind === "image" ? IMAGE_MIME : VIDEO_MIME;
  const max = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (!allowed.includes(file.type)) {
    throw new MediaError(
      `Unsupported ${kind} type (${file.type || "unknown"}). Allowed: ${allowed.join(", ")}`,
    );
  }
  if (file.size > max) {
    throw new MediaError(`${kind === "image" ? "Image" : "Video"} must be under ${Math.round(max / 1024 / 1024)}MB`);
  }
}

/**
 * Compress an image using a canvas. Re-encodes to JPEG/WebP at max width to
 * shrink large camera shots before upload. Falls back to the original file on
 * any error or for very small files.
 */
export async function compressImage(
  file: File,
  opts: { maxWidth?: number; quality?: number; mime?: "image/jpeg" | "image/webp" } = {},
): Promise<File> {
  const { maxWidth = 1600, quality = 0.82, mime = "image/jpeg" } = opts;
  if (file.size < 300 * 1024) return file; // <300KB: skip
  try {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, maxWidth / bitmap.width);
    const w = Math.round(bitmap.width * ratio);
    const h = Math.round(bitmap.height * ratio);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, mime, quality));
    if (!blob || blob.size >= file.size) return file;
    const ext = mime === "image/webp" ? "webp" : "jpg";
    return new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), { type: mime });
  } catch {
    return file;
  }
}

export async function uploadExerciseMediaSafe(
  rawFile: File,
  exerciseId: string,
  kind: "image" | "video",
): Promise<string> {
  validateFile(rawFile, kind);
  const file = kind === "image" ? await compressImage(rawFile) : rawFile;
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${exerciseId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("exercise-media")
    .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
  if (error) throw new MediaError(error.message);
  const { data } = supabase.storage.from("exercise-media").getPublicUrl(path);
  return data.publicUrl;
}
