import { supabase } from "@/integrations/supabase/client";

export { fetchPlayers, fetchTeamRoster } from "@/hooks/usePlayers";
export {
  fetchMatches,
  fetchMatch,
  fetchMatchSquad,
  fetchMatchReport,
  fetchMatchEvents,
} from "@/hooks/useMatches";
export { fetchMatchPreparation } from "@/hooks/useMatchPreparation";
export { fetchTrainingSessions } from "@/hooks/useTrainingSessions";
export { fetchClubAttendance, type ClubAttendanceRow } from "@/hooks/useAttendance";
export { fetchPlayerEvaluations } from "@/hooks/usePlayerEvaluations";

export interface ExportSession {
  id: string;
  name: string;
  date: string;
  ageGroup: string;
  teamId: string | null;
  totalDuration: number;
  exercises: { exercise: { title: string; type: string; duration: number; players: number }; notes: string; order: number }[];
}

/** Like fetchTrainingSessions, but scoped to a club and including team_id (not exposed on CloudSession). */
export async function fetchTrainingSessionsForExport(clubId: string): Promise<ExportSession[]> {
  const { data, error } = await supabase
    .from("training_sessions" as any)
    .select("*")
    .eq("club_id", clubId)
    .order("date", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    date: r.date,
    ageGroup: r.age_group,
    teamId: r.team_id ?? null,
    totalDuration: r.total_duration,
    exercises: (r.exercises ?? []) as ExportSession["exercises"],
  }));
}

export async function fetchTeams(clubId: string) {
  const { data, error } = await supabase
    .from("teams" as any)
    .select("id, name, age_category")
    .eq("club_id", clubId);
  if (error) throw error;
  return (data ?? []) as { id: string; name: string; age_category: string | null }[];
}

export async function fetchSeasons() {
  const { data, error } = await supabase.from("seasons" as any).select("id, name, start_date, end_date");
  if (error) throw error;
  return (data ?? []) as { id: string; name: string; start_date: string; end_date: string }[];
}

export interface ClubOverviewStats {
  teams: number;
  players: number;
  coaches: number;
  trainings: number;
  matches: number;
}

export async function fetchClubOverview(clubId: string): Promise<ClubOverviewStats> {
  const [teams, players, coaches, trainings, matches] = await Promise.all([
    supabase.from("teams" as any).select("id", { count: "exact", head: true }).eq("club_id", clubId),
    supabase.from("players_view" as any).select("id", { count: "exact", head: true }).eq("club_id", clubId).is("archived_at", null),
    supabase.from("club_members" as any).select("user_id", { count: "exact", head: true }).eq("club_id", clubId),
    supabase.from("training_sessions" as any).select("id", { count: "exact", head: true }).eq("club_id", clubId),
    supabase.from("matches" as any).select("id", { count: "exact", head: true }).eq("club_id", clubId),
  ]);
  return {
    teams: teams.count ?? 0,
    players: players.count ?? 0,
    coaches: coaches.count ?? 0,
    trainings: trainings.count ?? 0,
    matches: matches.count ?? 0,
  };
}

export interface ClubActivityRow {
  action: string;
  entity_type: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export async function fetchClubActivity(clubId: string, opts?: { dateFrom?: string; dateTo?: string; limit?: number }) {
  let q = supabase
    .from("club_activity" as any)
    .select("action, entity_type, metadata, created_at")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 200);
  if (opts?.dateFrom) q = q.gte("created_at", opts.dateFrom);
  if (opts?.dateTo) q = q.lte("created_at", opts.dateTo);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ClubActivityRow[];
}
