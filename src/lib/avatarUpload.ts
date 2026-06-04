import { supabase } from "@/integrations/supabase/client";

const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

/**
 * Upload an avatar to the private "avatars" bucket and return a long-lived signed URL.
 * Files are stored as `<user_id>/avatar-<timestamp>.<ext>` so storage RLS allows the owner to write.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Image must be smaller than 2MB");
  }

  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/avatar-${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadErr) throw uploadErr;

  const { data, error: signErr } = await supabase.storage
    .from("avatars")
    .createSignedUrl(path, ONE_YEAR_SEC);
  if (signErr || !data) throw signErr ?? new Error("Failed to sign avatar URL");

  return data.signedUrl;
}
