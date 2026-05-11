import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Season {
  id: string;
  user_id: string;
  club_id: string | null;
  name: string;
  start_date: string;
  end_date: string;
}

export interface WeeklyPlan {
  id: string;
  season_id: string;
  week_start: string;
  goals: string | null;
  session_ids: string[];
}

export function useSeasons() {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("seasons" as any).select("*").order("start_date");
      if (error) throw error;
      return (data ?? []) as unknown as Season[];
    },
  });
}

export function useCreateSeason() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { name: string; start_date: string; end_date: string; club_id?: string | null }) => {
      if (!user) throw new Error("Not authed");
      const { error } = await supabase.from("seasons" as any).insert({
        user_id: user.id,
        name: s.name,
        start_date: s.start_date,
        end_date: s.end_date,
        club_id: s.club_id ?? null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seasons"] }),
  });
}

export function useDeleteSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("seasons" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seasons"] }),
  });
}

export function useWeeklyPlans(seasonId: string | null) {
  return useQuery({
    queryKey: ["weekly_plans", seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_plans" as any)
        .select("*")
        .eq("season_id", seasonId!)
        .order("week_start");
      if (error) throw error;
      return (data ?? []) as unknown as WeeklyPlan[];
    },
  });
}

export function useUpsertWeeklyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { season_id: string; week_start: string; goals?: string; session_ids?: string[] }) => {
      const { error } = await supabase
        .from("weekly_plans" as any)
        .upsert(
          {
            season_id: p.season_id,
            week_start: p.week_start,
            goals: p.goals ?? null,
            session_ids: p.session_ids ?? [],
          } as any,
          { onConflict: "season_id,week_start" }
        );
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["weekly_plans", v.season_id] }),
  });
}
