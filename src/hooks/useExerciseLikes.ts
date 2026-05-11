import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useExerciseLikes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["exercise_likes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("exercise_likes" as any).select("exercise_id, user_id");
      if (error) throw error;
      const mine = new Set<string>();
      const counts: Record<string, number> = {};
      ((data ?? []) as any[]).forEach((r) => {
        counts[r.exercise_id] = (counts[r.exercise_id] ?? 0) + 1;
        if (user && r.user_id === user.id) mine.add(r.exercise_id);
      });
      return { mine, counts };
    },
  });
}

export function useToggleLike() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ exerciseId, liked }: { exerciseId: string; liked: boolean }) => {
      if (!user) throw new Error("Not authed");
      if (liked) {
        await supabase.from("exercise_likes" as any).delete().eq("exercise_id", exerciseId).eq("user_id", user.id);
      } else {
        await supabase.from("exercise_likes" as any).insert({ exercise_id: exerciseId, user_id: user.id } as any);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercise_likes"] }),
  });
}
