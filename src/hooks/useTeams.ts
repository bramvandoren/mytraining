import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Team {
  id: string;
  club_id: string;
  name: string;
  age_category: string | null;
  season_id: string | null;
  color: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useTeams(clubId: string | null) {
  return useQuery({
    queryKey: ["teams", clubId],
    enabled: !!clubId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams" as any).select("*").eq("club_id", clubId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Team[];
    },
  });
}

export function useCreateTeam() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Partial<Team>, "id"> & { club_id: string; name: string }) => {
      if (!user) throw new Error("Not authed");
      const { data, error } = await supabase
        .from("teams" as any)
        .insert({ ...input, created_by: user.id } as any)
        .select().single();
      if (error) throw error;
      return data as unknown as Team;
    },
    onSuccess: (t) => qc.invalidateQueries({ queryKey: ["teams", t.club_id] }),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Team> & { id: string }) => {
      const { data, error } = await supabase
        .from("teams" as any).update(patch as any).eq("id", id).select().single();
      if (error) throw error;
      return data as unknown as Team;
    },
    onSuccess: (t) => qc.invalidateQueries({ queryKey: ["teams", t.club_id] }),
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; clubId: string }) => {
      const { error } = await supabase.from("teams" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["teams", v.clubId] }),
  });
}
