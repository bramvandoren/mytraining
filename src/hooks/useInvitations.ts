import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { ClubRole } from "./useClubs";

export interface ClubInvitation {
  id: string;
  club_id: string;
  email: string;
  role: ClubRole;
  token: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
}

export function useInvitations(clubId: string | null) {
  return useQuery({
    queryKey: ["club_invitations", clubId],
    enabled: !!clubId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_invitations" as any).select("*")
        .eq("club_id", clubId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ClubInvitation[];
    },
  });
}

export function useCreateInvitation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, email, role }: { clubId: string; email: string; role: ClubRole }) => {
      if (!user) throw new Error("Not authed");
      const { data, error } = await supabase
        .from("club_invitations" as any)
        .insert({ club_id: clubId, email: email.toLowerCase().trim(), role, invited_by: user.id } as any)
        .select().single();
      if (error) throw error;
      return data as unknown as ClubInvitation;
    },
    onSuccess: (i) => qc.invalidateQueries({ queryKey: ["club_invitations", i.club_id] }),
  });
}

export function useDeleteInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; clubId: string }) => {
      const { error } = await supabase.from("club_invitations" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["club_invitations", v.clubId] }),
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc("accept_invitation" as any, { _token: token } as any);
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubs"] });
      qc.invalidateQueries({ queryKey: ["club_members"] });
    },
  });
}

export function useInvitationByToken(token: string | null) {
  return useQuery({
    queryKey: ["invitation_token", token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_invitation_by_token" as any, { _token: token } as any);
      if (error) throw error;
      const row = Array.isArray(data) ? (data as any[])[0] : data;
      if (!row) return null;
      return {
        id: row.id,
        club_id: row.club_id,
        email: row.email,
        role: row.role,
        expires_at: row.expires_at,
        accepted_at: row.accepted_at,
        clubs: { name: row.club_name },
      } as any;
    },
  });
}
