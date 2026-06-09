import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ClubMedia {
  id: string;
  club_id: string;
  uploaded_by: string;
  folder: string;
  name: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
  tags: string[];
  created_at: string;
}

export function useClubMedia(clubId: string | null) {
  return useQuery({
    queryKey: ["club_media", clubId],
    enabled: !!clubId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_media" as any).select("*")
        .eq("club_id", clubId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ClubMedia[];
    },
  });
}

export function useUploadClubMedia() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, file, folder = "/", tags = [] }: { clubId: string; file: File; folder?: string; tags?: string[] }) => {
      if (!user) throw new Error("Not authed");
      const safeName = file.name.replace(/[^\w.\-]/g, "_");
      const path = `${clubId}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from("club-media").upload(path, file);
      if (upErr) throw upErr;
      const { data, error } = await supabase
        .from("club_media" as any)
        .insert({
          club_id: clubId, uploaded_by: user.id, folder, name: file.name,
          mime_type: file.type, size_bytes: file.size, storage_path: path, tags,
        } as any)
        .select().single();
      if (error) throw error;
      return data as unknown as ClubMedia;
    },
    onSuccess: (m) => qc.invalidateQueries({ queryKey: ["club_media", m.club_id] }),
  });
}

export function useDeleteClubMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storage_path }: ClubMedia) => {
      await supabase.storage.from("club-media").remove([storage_path]);
      const { error } = await supabase.from("club_media" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, m) => qc.invalidateQueries({ queryKey: ["club_media", m.club_id] }),
  });
}

export async function getMediaSignedUrl(storage_path: string) {
  const { data, error } = await supabase.storage.from("club-media").createSignedUrl(storage_path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
