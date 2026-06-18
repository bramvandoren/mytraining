import { supabase } from "@/integrations/supabase/client";

export interface ClubBranding {
  name: string;
  logoDataUrl: string | null;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Resolves club name + logo for embedding in generated exports. Never
 * throws — a missing/unreadable logo just falls back to name-only
 * branding so an export is never blocked by a broken image.
 */
export async function getClubBranding(clubId: string): Promise<ClubBranding> {
  const { data, error } = await supabase
    .from("clubs" as any)
    .select("name, logo_storage_path")
    .eq("id", clubId)
    .maybeSingle();
  if (error || !data) return { name: "Club", logoDataUrl: null };
  const club = data as any;

  if (!club.logo_storage_path) return { name: club.name, logoDataUrl: null };

  try {
    const { data: signed, error: signErr } = await supabase.storage
      .from("club-media")
      .createSignedUrl(club.logo_storage_path, 60);
    if (signErr || !signed) return { name: club.name, logoDataUrl: null };
    const res = await fetch(signed.signedUrl);
    if (!res.ok) return { name: club.name, logoDataUrl: null };
    const blob = await res.blob();
    const logoDataUrl = await blobToDataUrl(blob);
    return { name: club.name, logoDataUrl };
  } catch {
    return { name: club.name, logoDataUrl: null };
  }
}
