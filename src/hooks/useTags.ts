import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Tag {
  id: string;
  slug: string;
  name: string;
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags" as any).select("*").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Tag[];
    },
  });
}

export function useExerciseTagMap() {
  return useQuery({
    queryKey: ["exercise_tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exercise_tags" as any).select("*");
      if (error) throw error;
      const map: Record<string, string[]> = {};
      ((data ?? []) as any[]).forEach((row) => {
        if (!map[row.exercise_id]) map[row.exercise_id] = [];
        map[row.exercise_id].push(row.tag_id);
      });
      return map;
    },
  });
}

export function useSetExerciseTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ exerciseId, tagIds }: { exerciseId: string; tagIds: string[] }) => {
      await supabase.from("exercise_tags" as any).delete().eq("exercise_id", exerciseId);
      if (tagIds.length) {
        const rows = tagIds.map((t) => ({ exercise_id: exerciseId, tag_id: t }));
        const { error } = await supabase.from("exercise_tags" as any).insert(rows as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercise_tags"] }),
  });
}
