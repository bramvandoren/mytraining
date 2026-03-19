import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", userId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!userId,
  });
}

export function useProfiles(userIds: string[]) {
  return useQuery({
    queryKey: ["profiles", userIds.sort().join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      if (error) return {};
      const map: Record<string, { display_name: string; avatar_url: string | null }> = {};
      for (const p of data) map[p.id] = p;
      return map;
    },
    enabled: userIds.length > 0,
  });
}
