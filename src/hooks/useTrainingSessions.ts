import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SessionExercise, AgeGroup, TrainingSession } from "@/data/exercises";
import { useAuth } from "./useAuth";

export interface CloudSession extends TrainingSession {
  user_id: string;
  total_duration: number;
}

export function useTrainingSessions() {
  return useQuery({
    queryKey: ["training_sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any): CloudSession => ({
        id: r.id,
        name: r.name,
        date: r.date,
        ageGroup: r.age_group as AgeGroup,
        exercises: (r.exercises ?? []) as SessionExercise[],
        createdAt: r.created_at,
        user_id: r.user_id,
        total_duration: r.total_duration,
      }));
    },
  });
}

export function useSaveSession() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { id?: string; name: string; date: string; ageGroup: AgeGroup; exercises: SessionExercise[] }) => {
      if (!user) throw new Error("Not authenticated");
      const total = s.exercises.reduce((sum, e) => sum + e.exercise.duration, 0);
      const payload = {
        user_id: user.id,
        name: s.name,
        date: s.date,
        age_group: s.ageGroup,
        exercises: s.exercises as any,
        total_duration: total,
      };
      if (s.id) {
        const { error } = await supabase.from("training_sessions").update(payload).eq("id", s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("training_sessions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_sessions"] }),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_sessions"] }),
  });
}
