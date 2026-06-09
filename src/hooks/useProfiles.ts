import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProfileLite {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

export function useProfiles(userIds: string[]) {
  const ids = Array.from(new Set(userIds.filter(Boolean))).sort();
  return useQuery({
    queryKey: ["profiles", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles").select("id, display_name, username, avatar_url").in("id", ids);
      if (error) throw error;
      const map: Record<string, ProfileLite> = {};
      for (const p of (data ?? []) as ProfileLite[]) map[p.id] = p;
      return map;
    },
  });
}
