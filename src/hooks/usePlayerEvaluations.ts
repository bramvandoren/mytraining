import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PlayerEvaluation {
  id: string;
  club_id: string;
  player_id: string;
  team_id: string | null;
  season_id: string | null;
  evaluator_id: string;
  evaluation_date: string;
  technical_rating: number | null;
  tactical_rating: number | null;
  physical_rating: number | null;
  mental_rating: number | null;
  overall_rating: number | null;
  strengths: string | null;
  areas_to_improve: string | null;
  coach_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NewPlayerEvaluation = Pick<
  PlayerEvaluation,
  "club_id" | "player_id" | "evaluation_date"
> &
  Partial<
    Pick<
      PlayerEvaluation,
      | "team_id"
      | "season_id"
      | "technical_rating"
      | "tactical_rating"
      | "physical_rating"
      | "mental_rating"
      | "overall_rating"
      | "strengths"
      | "areas_to_improve"
      | "coach_notes"
    >
  >;

export async function fetchPlayerEvaluations(playerId: string) {
  const { data, error } = await supabase
    .from("player_evaluations" as any)
    .select("*")
    .eq("player_id", playerId)
    .order("evaluation_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PlayerEvaluation[];
}

export function usePlayerEvaluations(playerId: string | null) {
  return useQuery({
    queryKey: ["player_evaluations", playerId],
    enabled: !!playerId,
    queryFn: () => fetchPlayerEvaluations(playerId!),
  });
}

export function useCreateEvaluation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewPlayerEvaluation) => {
      if (!user) throw new Error("Not authed");
      const { error } = await supabase
        .from("player_evaluations" as any)
        .insert({ ...input, evaluator_id: user.id } as any);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["player_evaluations", v.player_id] }),
  });
}

export function useDeleteEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; playerId: string }) => {
      const { error } = await supabase.from("player_evaluations" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["player_evaluations", v.playerId] }),
  });
}

export const RATING_FIELDS = [
  { key: "technical_rating", label: "Technical" },
  { key: "tactical_rating", label: "Tactical" },
  { key: "physical_rating", label: "Physical" },
  { key: "mental_rating", label: "Mental" },
  { key: "overall_rating", label: "Overall" },
] as const;
