import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type MatchType = "league" | "cup" | "friendly";
export type MatchVenue = "home" | "away";
export type MatchStatus = "scheduled" | "cancelled" | "completed";
export type SquadStatus = "selected" | "not_selected" | "injured" | "suspended";
export type MatchEventType = "goal" | "assist" | "yellow_card" | "red_card";

export interface Match {
  id: string;
  club_id: string;
  team_id: string | null;
  opponent: string;
  match_date: string;
  kickoff_time: string | null;
  location: string | null;
  competition: string | null;
  venue: MatchVenue;
  match_type: MatchType;
  status: MatchStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MatchSquad {
  id: string;
  match_id: string;
  player_id: string;
  status: SquadStatus;
  is_starter: boolean;
  shirt_number: number | null;
}

export interface PitchPosition {
  player_id: string;
  x: number; // 0-100
  y: number; // 0-100
  role?: string;
}

export interface MatchLineup {
  id: string;
  match_id: string;
  formation: string;
  positions: PitchPosition[];
  bench: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MatchReport {
  id: string;
  match_id: string;
  our_score: number | null;
  opp_score: number | null;
  ht_our_score: number | null;
  ht_opp_score: number | null;
  what_went_well: string | null;
  what_to_improve: string | null;
  next_training_focus: string | null;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string | null;
  event_type: MatchEventType;
  minute: number | null;
  note: string | null;
}

export const MATCH_TYPE_LABEL: Record<MatchType, string> = {
  league: "League",
  cup: "Cup",
  friendly: "Friendly",
};

export const SQUAD_STATUS_LABEL: Record<SquadStatus, string> = {
  selected: "Selected",
  not_selected: "Not selected",
  injured: "Injured",
  suspended: "Suspended",
};

export const SQUAD_STATUS_COLOR: Record<SquadStatus, string> = {
  selected: "bg-emerald-500 text-white",
  not_selected: "bg-muted text-muted-foreground",
  injured: "bg-amber-500 text-white",
  suspended: "bg-rose-500 text-white",
};

/* ===== matches ===== */
export async function fetchMatches(clubId: string) {
  const { data, error } = await supabase
    .from("matches" as any)
    .select("*")
    .eq("club_id", clubId)
    .order("match_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Match[];
}

export function useMatches(clubId: string | null) {
  return useQuery({
    queryKey: ["matches", clubId],
    enabled: !!clubId,
    queryFn: () => fetchMatches(clubId!),
  });
}

export async function fetchMatch(id: string) {
  const { data, error } = await supabase
    .from("matches" as any).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as Match | null;
}

export function useMatch(id: string | null) {
  return useQuery({
    queryKey: ["match", id],
    enabled: !!id,
    queryFn: () => fetchMatch(id!),
  });
}

export function useCreateMatch() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Partial<Match>, "id"> & { club_id: string; opponent: string; match_date: string }) => {
      if (!user) throw new Error("Not authed");
      const { data, error } = await supabase
        .from("matches" as any)
        .insert({ ...input, created_by: user.id } as any)
        .select().single();
      if (error) throw error;
      return data as unknown as Match;
    },
    onSuccess: (m) => qc.invalidateQueries({ queryKey: ["matches", m.club_id] }),
  });
}

export function useUpdateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Match> & { id: string }) => {
      const { data, error } = await supabase
        .from("matches" as any).update(patch as any).eq("id", id).select().single();
      if (error) throw error;
      return data as unknown as Match;
    },
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: ["matches", m.club_id] });
      qc.invalidateQueries({ queryKey: ["match", m.id] });
    },
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; clubId: string }) => {
      const { error } = await supabase.from("matches" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["matches", v.clubId] }),
  });
}

export function useDuplicateMatch() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Match) => {
      if (!user) throw new Error("Not authed");
      const { id, created_at, updated_at, created_by, ...rest } = m;
      const { data, error } = await supabase
        .from("matches" as any)
        .insert({ ...rest, created_by: user.id, status: "scheduled" } as any)
        .select().single();
      if (error) throw error;
      return data as unknown as Match;
    },
    onSuccess: (m) => qc.invalidateQueries({ queryKey: ["matches", m.club_id] }),
  });
}

/* ===== squad ===== */
export async function fetchMatchSquad(matchId: string) {
  const { data, error } = await supabase
    .from("match_squads" as any).select("*").eq("match_id", matchId);
  if (error) throw error;
  return (data ?? []) as unknown as MatchSquad[];
}

export function useMatchSquad(matchId: string | null) {
  return useQuery({
    queryKey: ["match_squad", matchId],
    enabled: !!matchId,
    queryFn: () => fetchMatchSquad(matchId!),
  });
}

export function useUpsertSquadEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Partial<MatchSquad>, "id"> & { match_id: string; player_id: string }) => {
      const { error } = await supabase
        .from("match_squads" as any)
        .upsert(input as any, { onConflict: "match_id,player_id" } as any);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["match_squad", v.match_id] }),
  });
}

/* ===== lineup ===== */
export function useMatchLineup(matchId: string | null) {
  return useQuery({
    queryKey: ["match_lineup", matchId],
    enabled: !!matchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_lineups" as any).select("*").eq("match_id", matchId!).maybeSingle();
      if (error) throw error;
      return data as unknown as MatchLineup | null;
    },
  });
}

export function useSaveLineup() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { match_id: string; formation: string; positions: PitchPosition[]; bench: string[] }) => {
      if (!user) throw new Error("Not authed");
      const { error } = await supabase
        .from("match_lineups" as any)
        .upsert(
          { ...input, created_by: user.id } as any,
          { onConflict: "match_id" } as any,
        );
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["match_lineup", v.match_id] }),
  });
}

/* ===== report ===== */
export async function fetchMatchReport(matchId: string) {
  const { data, error } = await supabase
    .from("match_reports" as any).select("*").eq("match_id", matchId).maybeSingle();
  if (error) throw error;
  return data as unknown as MatchReport | null;
}

export function useMatchReport(matchId: string | null) {
  return useQuery({
    queryKey: ["match_report", matchId],
    enabled: !!matchId,
    queryFn: () => fetchMatchReport(matchId!),
  });
}

export function useSaveReport() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Partial<MatchReport>, "id"> & { match_id: string }) => {
      if (!user) throw new Error("Not authed");
      const { error } = await supabase
        .from("match_reports" as any)
        .upsert({ ...input, created_by: user.id } as any, { onConflict: "match_id" } as any);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["match_report", v.match_id] }),
  });
}

/* ===== events ===== */
export async function fetchMatchEvents(matchId: string) {
  const { data, error } = await supabase
    .from("match_events" as any).select("*").eq("match_id", matchId).order("minute", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as MatchEvent[];
}

export function useMatchEvents(matchId: string | null) {
  return useQuery({
    queryKey: ["match_events", matchId],
    enabled: !!matchId,
    queryFn: () => fetchMatchEvents(matchId!),
  });
}

export function useAddMatchEvent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Partial<MatchEvent>, "id"> & { match_id: string; event_type: MatchEventType }) => {
      if (!user) throw new Error("Not authed");
      const { error } = await supabase
        .from("match_events" as any).insert({ ...input, created_by: user.id } as any);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["match_events", v.match_id] }),
  });
}

export function useDeleteMatchEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; matchId: string }) => {
      const { error } = await supabase.from("match_events" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["match_events", v.matchId] }),
  });
}

/* ===== formations ===== */
export const FORMATIONS: Record<string, { x: number; y: number }[]> = {
  "4-3-3": [
    { x: 50, y: 92 }, // GK
    { x: 15, y: 72 }, { x: 38, y: 75 }, { x: 62, y: 75 }, { x: 85, y: 72 }, // back
    { x: 25, y: 50 }, { x: 50, y: 52 }, { x: 75, y: 50 }, // mid
    { x: 20, y: 22 }, { x: 50, y: 18 }, { x: 80, y: 22 }, // fwd
  ],
  "4-4-2": [
    { x: 50, y: 92 },
    { x: 15, y: 72 }, { x: 38, y: 75 }, { x: 62, y: 75 }, { x: 85, y: 72 },
    { x: 15, y: 48 }, { x: 38, y: 50 }, { x: 62, y: 50 }, { x: 85, y: 48 },
    { x: 35, y: 20 }, { x: 65, y: 20 },
  ],
  "3-5-2": [
    { x: 50, y: 92 },
    { x: 25, y: 75 }, { x: 50, y: 78 }, { x: 75, y: 75 },
    { x: 12, y: 55 }, { x: 30, y: 48 }, { x: 50, y: 52 }, { x: 70, y: 48 }, { x: 88, y: 55 },
    { x: 35, y: 20 }, { x: 65, y: 20 },
  ],
  "4-2-3-1": [
    { x: 50, y: 92 },
    { x: 15, y: 72 }, { x: 38, y: 75 }, { x: 62, y: 75 }, { x: 85, y: 72 },
    { x: 35, y: 58 }, { x: 65, y: 58 },
    { x: 20, y: 35 }, { x: 50, y: 38 }, { x: 80, y: 35 },
    { x: 50, y: 15 },
  ],
};
