import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Announcement {
  id: string;
  club_id: string;
  team_id: string | null;
  title: string;
  body: string;
  author_id: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export function useAnnouncements(clubId: string | null) {
  return useQuery({
    queryKey: ["announcements", clubId],
    enabled: !!clubId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements" as any)
        .select("*")
        .eq("club_id", clubId!)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Announcement[];
    },
  });
}

export function useCreateAnnouncement() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      club_id: string;
      title: string;
      body: string;
      team_id?: string | null;
      pinned?: boolean;
    }) => {
      if (!user) throw new Error("Not authed");
      const { data, error } = await supabase
        .from("announcements" as any)
        .insert({ ...input, author_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Announcement;
    },
    onSuccess: (a) =>
      qc.invalidateQueries({ queryKey: ["announcements", (a as Announcement).club_id] }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Announcement> & { id: string }) => {
      const { data, error } = await supabase
        .from("announcements" as any)
        .update(patch as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Announcement;
    },
    onSuccess: (a) =>
      qc.invalidateQueries({ queryKey: ["announcements", (a as Announcement).club_id] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clubId }: { id: string; clubId: string }) => {
      const { error } = await supabase
        .from("announcements" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ["announcements", v.clubId] }),
  });
}
