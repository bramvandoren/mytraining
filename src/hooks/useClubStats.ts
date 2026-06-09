import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useClubStats(clubId: string | null) {
  return useQuery({
    queryKey: ["club_stats", clubId],
    enabled: !!clubId,
    queryFn: async () => {
      const [coaches, teams, exercises, trainings, upcoming] = await Promise.all([
        supabase.from("club_members" as any).select("user_id", { count: "exact", head: true }).eq("club_id", clubId!),
        supabase.from("teams" as any).select("id", { count: "exact", head: true }).eq("club_id", clubId!),
        supabase.from("custom_exercises" as any).select("id", { count: "exact", head: true }).eq("club_id", clubId!),
        supabase.from("training_sessions" as any).select("id", { count: "exact", head: true }).eq("club_id", clubId!),
        supabase.from("training_sessions" as any)
          .select("id,name,date,age_group")
          .eq("club_id", clubId!)
          .gte("date", new Date().toISOString().slice(0, 10))
          .order("date", { ascending: true })
          .limit(5),
      ]);
      return {
        coaches: coaches.count ?? 0,
        teams: teams.count ?? 0,
        exercises: exercises.count ?? 0,
        trainings: trainings.count ?? 0,
        upcoming: ((upcoming.data ?? []) as unknown) as Array<{ id: string; name: string; date: string; age_group: string }>,
      };
    },
  });
}
