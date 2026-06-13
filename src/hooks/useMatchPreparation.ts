import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface MatchPreparation {
  id: string;
  match_id: string;
  match_objectives: string | null;
  tactical_notes: string | null;
  opponent_analysis: string | null;
  coach_notes: string | null;
  key_focus_points: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useMatchPreparation(matchId: string | null) {
  return useQuery({
    queryKey: ["match_preparation", matchId],
    enabled: !!matchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_preparation" as any)
        .select("*")
        .eq("match_id", matchId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as MatchPreparation | null;
    },
  });
}

export function useSaveMatchPreparation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<Partial<MatchPreparation>, "id" | "created_by" | "created_at" | "updated_at"> & {
        match_id: string;
      },
    ) => {
      if (!user) throw new Error("Not authed");
      const { error } = await supabase
        .from("match_preparation" as any)
        .upsert({ ...input, created_by: user.id } as any, { onConflict: "match_id" } as any);
      if (error) throw error;
    },
    onSuccess: (_, v) =>
      qc.invalidateQueries({ queryKey: ["match_preparation", v.match_id] }),
  });
}
