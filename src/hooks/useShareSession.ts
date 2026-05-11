import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function genToken() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function useEnableShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string): Promise<string> => {
      const { data: existing } = await supabase
        .from("training_sessions")
        .select("share_token, is_shared")
        .eq("id", sessionId)
        .maybeSingle();
      const token = (existing as any)?.share_token ?? genToken();
      const { error } = await supabase
        .from("training_sessions")
        .update({ share_token: token, is_shared: true } as any)
        .eq("id", sessionId);
      if (error) throw error;
      return token;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_sessions"] }),
  });
}

export function useSharedSession(token: string | undefined) {
  return useQuery({
    queryKey: ["shared", token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_shared_session" as any, { _token: token! });
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as null | {
        id: string;
        name: string;
        date: string;
        age_group: string;
        exercises: any[];
        total_duration: number;
        created_at: string;
      };
    },
  });
}
