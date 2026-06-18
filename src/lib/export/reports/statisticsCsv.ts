import { fetchTeams, fetchTrainingSessionsForExport, fetchMatches, fetchClubAttendance } from "../fetchers";
import { downloadCsv } from "../csv";
import type { ExportFilters } from "../types";
import { inDateRange } from "../types";

const PRESENT_STATUSES = new Set(["present", "late"]);

export async function exportStatisticsCsv(clubId: string, filters: ExportFilters) {
  const [teams, sessions, matches, attendance] = await Promise.all([
    fetchTeams(clubId),
    fetchTrainingSessionsForExport(clubId),
    fetchMatches(clubId),
    fetchClubAttendance(clubId, { dateFrom: filters.dateFrom ?? undefined, dateTo: filters.dateTo ?? undefined }),
  ]);

  const rows = teams.map((team) => {
    const trainingCount = sessions.filter(
      (s) => s.teamId === team.id && inDateRange(s.date, filters.dateFrom, filters.dateTo),
    ).length;
    const matchCount = matches.filter(
      (m) => m.team_id === team.id && inDateRange(m.match_date, filters.dateFrom, filters.dateTo),
    ).length;
    const teamAttendance = attendance.filter((a) => a.team_id === team.id);
    const present = teamAttendance.filter((a) => PRESENT_STATUSES.has(a.status)).length;
    const rate = teamAttendance.length ? Math.round((present / teamAttendance.length) * 100) : "";
    return [team.name, trainingCount, matchCount, rate];
  });

  downloadCsv("Statistics.csv", ["Team", "Trainings", "Matches", "Avg attendance rate %"], rows);
}
