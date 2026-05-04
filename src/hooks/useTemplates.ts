import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SessionExercise } from "@/data/exercises";
import { useAuth } from "./useAuth";

export interface TrainingTemplate {
  id: string;
  user_id: string;
  name: string;
  exercises: SessionExercise[];
  total_duration: number;
  created_at: string;
}

export function useTemplates() {
  return useQuery({
    queryKey: ["training_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any): TrainingTemplate => ({
        id: r.id,
        user_id: r.user_id,
        name: r.name,
        exercises: (r.exercises ?? []) as SessionExercise[],
        total_duration: r.total_duration,
        created_at: r.created_at,
      }));
    },
  });
}

export function useSaveTemplate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: { name: string; exercises: SessionExercise[] }) => {
      if (!user) throw new Error("Not authenticated");
      const total = t.exercises.reduce((s, e) => s + e.exercise.duration, 0);
      const { error } = await supabase.from("training_templates").insert({
        user_id: user.id,
        name: t.name,
        exercises: t.exercises as any,
        total_duration: total,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_templates"] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_templates"] }),
  });
}
