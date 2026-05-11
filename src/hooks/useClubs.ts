import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect, useState } from "react";

export interface Club {
  id: string;
  name: string;
  owner_id: string;
  is_personal: boolean;
}

export interface ClubMember {
  club_id: string;
  user_id: string;
  role: "admin" | "coach";
}

export function useClubs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["clubs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("clubs" as any).select("*");
      if (error) throw error;
      return (data ?? []) as unknown as Club[];
    },
  });
}

export function useActiveClub() {
  const { data: clubs = [] } = useClubs();
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem("activeClubId"));
  useEffect(() => {
    if (!activeId && clubs.length) {
      const personal = clubs.find((c) => c.is_personal) ?? clubs[0];
      setActiveId(personal.id);
      localStorage.setItem("activeClubId", personal.id);
    }
  }, [clubs, activeId]);
  const set = (id: string) => {
    setActiveId(id);
    localStorage.setItem("activeClubId", id);
  };
  const active = clubs.find((c) => c.id === activeId) ?? null;
  return { active, activeId, setActiveId: set, clubs };
}

export function useClubMembers(clubId: string | null) {
  return useQuery({
    queryKey: ["club_members", clubId],
    enabled: !!clubId,
    queryFn: async () => {
      const { data, error } = await supabase.from("club_members" as any).select("*").eq("club_id", clubId!);
      if (error) throw error;
      return (data ?? []) as unknown as ClubMember[];
    },
  });
}

export function useCreateClub() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authed");
      const { data: club, error } = await supabase
        .from("clubs" as any)
        .insert({ name, owner_id: user.id, is_personal: false } as any)
        .select()
        .single();
      if (error) throw error;
      const c = club as any;
      const { error: e2 } = await supabase
        .from("club_members" as any)
        .insert({ club_id: c.id, user_id: user.id, role: "admin" } as any);
      if (e2) throw e2;
      return c as Club;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clubs"] }),
  });
}

export function useAddMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, displayName, role }: { clubId: string; displayName: string; role: "admin" | "coach" }) => {
      const { data: prof, error: e0 } = await supabase
        .from("profiles")
        .select("id")
        .eq("display_name", displayName)
        .maybeSingle();
      if (e0) throw e0;
      if (!prof) throw new Error("User not found");
      const { error } = await supabase
        .from("club_members" as any)
        .insert({ club_id: clubId, user_id: prof.id, role } as any);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["club_members", v.clubId] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, userId }: { clubId: string; userId: string }) => {
      const { error } = await supabase
        .from("club_members" as any)
        .delete()
        .eq("club_id", clubId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["club_members", v.clubId] }),
  });
}
