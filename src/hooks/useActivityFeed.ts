import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClubActivity {
  id: string;
  club_id: string;
  actor_id: string | null;
  /** Back-compat alias used by older components */
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export function useActivityFeed(clubId: string | null, limit = 50) {
  return useQuery({
    queryKey: ["club_activity", clubId, limit],
    enabled: !!clubId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_activity" as any).select("*")
        .eq("club_id", clubId!)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        user_id: r.actor_id ?? null,
      })) as ClubActivity[];
    },
  });
}
