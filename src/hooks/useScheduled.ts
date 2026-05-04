import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ScheduledTraining {
  id: string;
  user_id: string;
  session_id: string | null;
  scheduled_date: string;
  repeat_weekly: boolean;
  notes: string | null;
}

export function useScheduled() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["scheduled_trainings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_trainings")
        .select("*")
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ScheduledTraining[];
    },
  });
}

export function useScheduleTraining() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { session_id: string; scheduled_date: string; repeat_weekly?: boolean; notes?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("scheduled_trainings").insert({
        user_id: user.id,
        session_id: input.session_id,
        scheduled_date: input.scheduled_date,
        repeat_weekly: input.repeat_weekly ?? false,
        notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled_trainings"] }),
  });
}

export function useDeleteScheduled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scheduled_trainings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scheduled_trainings"] }),
  });
}
