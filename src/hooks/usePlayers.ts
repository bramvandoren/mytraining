import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type PlayerFoot = "left" | "right" | "both";
export type PlayerPosition = "gk" | "def" | "mid" | "fwd";

export interface Player {
  id: string;
  club_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  birth_date: string | null;
  nationality: string | null;
  preferred_foot: PlayerFoot | null;
  position: PlayerPosition | null;
  jersey_number: number | null;
  notes: string | null;
  emergency_contact: string | null;
  parent_contact: string | null;
  medical_notes: string | null;
  archived_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  current_team_id: string | null;
}

export type PlayerInput = Omit<
  Partial<Player>,
  "id" | "created_at" | "updated_at" | "created_by" | "current_team_id"
> & { club_id: string; first_name: string; last_name: string };

export async function fetchPlayers(clubId: string, opts?: { includeArchived?: boolean }) {
  let q = supabase
    .from("players_view" as any)
    .select("*")
    .eq("club_id", clubId)
    .order("last_name", { ascending: true });
  if (!opts?.includeArchived) q = q.is("archived_at", null);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Player[];
}

export function usePlayers(clubId: string | null, opts?: { includeArchived?: boolean }) {
  return useQuery({
    queryKey: ["players", clubId, opts?.includeArchived ?? false],
    enabled: !!clubId,
    queryFn: () => fetchPlayers(clubId!, opts),
  });
}

export function usePlayer(id: string | null) {
  return useQuery({
    queryKey: ["player", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players_view" as any)
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Player | null;
    },
  });
}

export async function fetchTeamRoster(teamId: string) {
  const { data: assigns, error } = await supabase
    .from("player_team_assignments" as any)
    .select("player_id")
    .eq("team_id", teamId)
    .is("ended_at", null);
  if (error) throw error;
  const ids = (assigns ?? []).map((a: any) => a.player_id);
  if (ids.length === 0) return [] as Player[];
  const { data: players, error: e2 } = await supabase
    .from("players_view" as any)
    .select("*")
    .in("id", ids)
    .is("archived_at", null);
  if (e2) throw e2;
  return ((players ?? []) as unknown) as Player[];
}

export function useTeamRoster(teamId: string | null) {
  return useQuery({
    queryKey: ["team_roster", teamId],
    enabled: !!teamId,
    queryFn: () => fetchTeamRoster(teamId!),
  });
}

export function useCreatePlayer() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlayerInput & { team_id?: string | null }) => {
      if (!user) throw new Error("Not authed");
      const { team_id, ...playerData } = input;
      const { data, error } = await supabase
        .from("players" as any)
        .insert({ ...playerData, created_by: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      const player = data as any;
      if (team_id) {
        const { error: e2 } = await supabase
          .from("player_team_assignments" as any)
          .insert({ player_id: player.id, team_id } as any);
        if (e2) throw e2;
      }
      return player as Player;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["players", p.club_id] });
      qc.invalidateQueries({ queryKey: ["team_roster"] });
    },
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Player> & { id: string }) => {
      const { current_team_id: _ignore, ...rest } = patch as any;
      const { data, error } = await supabase
        .from("players" as any)
        .update(rest as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Player;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["players", p.club_id] });
      qc.invalidateQueries({ queryKey: ["player", p.id] });
    },
  });
}

export function useArchivePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      const { error } = await supabase
        .from("players" as any)
        .update({ archived_at: archive ? new Date().toISOString() : null } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["players"] }),
  });
}

export function useTransferPlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ playerId, toTeamId }: { playerId: string; toTeamId: string | null }) => {
      // close any active assignment
      const { error: e1 } = await supabase
        .from("player_team_assignments" as any)
        .update({ ended_at: new Date().toISOString() } as any)
        .eq("player_id", playerId)
        .is("ended_at", null);
      if (e1) throw e1;
      if (toTeamId) {
        const { error: e2 } = await supabase
          .from("player_team_assignments" as any)
          .insert({ player_id: playerId, team_id: toTeamId } as any);
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["players"] });
      qc.invalidateQueries({ queryKey: ["team_roster"] });
      qc.invalidateQueries({ queryKey: ["player"] });
    },
  });
}

export const POSITION_LABEL: Record<PlayerPosition, string> = {
  gk: "Goalkeeper",
  def: "Defender",
  mid: "Midfielder",
  fwd: "Forward",
};
export const POSITION_SHORT: Record<PlayerPosition, string> = {
  gk: "GK",
  def: "DEF",
  mid: "MID",
  fwd: "FWD",
};
