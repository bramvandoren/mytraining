import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Exercise } from "@/data/exercises";
import { useAuth } from "@/hooks/useAuth";

export interface FieldElement {
  id: string;
  type: "cone" | "player" | "goal" | "arrow" | "zone" | "ball";
  x: number;
  y: number;
  rotation?: number;
  width?: number;
  height?: number;
  color?: string;
  label?: string;
  // Arrow specific
  endX?: number;
  endY?: number;
  arrowStyle?: "solid" | "dashed" | "wavy";
}

export interface FieldDiagram {
  elements: FieldElement[];
  fieldType: "full" | "half" | "quarter";
}

export interface CustomExerciseRow {
  id: string;
  title: string;
  description: string;
  players: number;
  duration: number;
  age_groups: string[];
  skill_level: string;
  exercise_type: string;
  field_size: string;
  icon: string;
  field_diagram: FieldDiagram | null;
  preview_image_url: string | null;
  video_url: string | null;
  is_predefined: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function customExerciseToExercise(row: CustomExerciseRow): Exercise & { isCustom: true; customId: string; fieldDiagram: FieldDiagram | null; previewImageUrl: string | null; videoUrl: string | null; userId: string | null } {
  return {
    id: `custom-${row.id}`,
    customId: row.id,
    title: row.title,
    description: row.description,
    players: row.players,
    duration: row.duration,
    ageGroups: row.age_groups as any[],
    skillLevel: row.skill_level as any,
    type: row.exercise_type as any,
    fieldSize: row.field_size as any,
    icon: row.icon,
    isCustom: true,
    fieldDiagram: row.field_diagram,
    previewImageUrl: row.preview_image_url,
    videoUrl: row.video_url,
    userId: row.user_id,
  };
}

export function useCustomExercises() {
  return useQuery({
    queryKey: ["custom-exercises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_exercises")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as CustomExerciseRow[]).map(customExerciseToExercise);
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (exercise: {
      title: string;
      description: string;
      players: number;
      duration: number;
      age_groups: string[];
      skill_level: string;
      exercise_type: string;
      field_size: string;
      icon: string;
      field_diagram?: FieldDiagram;
      preview_image_url?: string;
      video_url?: string;
    }) => {
      const { data, error } = await supabase
        .from("custom_exercises")
        .insert({
          title: exercise.title,
          description: exercise.description,
          players: exercise.players,
          duration: exercise.duration,
          age_groups: exercise.age_groups,
          skill_level: exercise.skill_level,
          exercise_type: exercise.exercise_type,
          field_size: exercise.field_size,
          icon: exercise.icon,
          field_diagram: exercise.field_diagram as any,
          preview_image_url: exercise.preview_image_url ?? null,
          video_url: exercise.video_url ?? null,
          user_id: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-exercises"] }),
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...exercise }: {
      id: string;
      title?: string;
      description?: string;
      players?: number;
      duration?: number;
      age_groups?: string[];
      skill_level?: string;
      exercise_type?: string;
      field_size?: string;
      icon?: string;
      field_diagram?: FieldDiagram;
      preview_image_url?: string;
      video_url?: string;
    }) => {
      const { data, error } = await supabase
        .from("custom_exercises")
        .update(exercise as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-exercises"] }),
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["custom-exercises"] }),
  });
}

export async function uploadExerciseMedia(file: File, exerciseId: string): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${exerciseId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("exercise-media").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("exercise-media").getPublicUrl(path);
  return data.publicUrl;
}
