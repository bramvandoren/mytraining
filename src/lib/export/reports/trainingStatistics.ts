import { supabase } from "@/integrations/supabase/client";
import { getClubBranding } from "../branding";
import { fetchTrainingSessionsForExport, fetchTeams } from "../fetchers";
import { createBrandedWorkbook, addBrandedHeader, addTable, downloadWorkbook } from "../excel";
import { slug } from "../download";
import type { ExportFilters } from "../types";
import { inDateRange } from "../types";

const PRESENT_STATUSES = new Set(["present", "late"]);

export async function exportTrainingStatisticsExcel(clubId: string, filters: ExportFilters) {
  const [branding, sessions, teams] = await Promise.all([
    getClubBranding(clubId),
    fetchTrainingSessionsForExport(clubId),
    fetchTeams(clubId),
  ]);
  const teamName = new Map(teams.map((t) => [t.id, t.name]));
  const filtered = sessions
    .filter((s) => !filters.teamId || s.teamId === filters.teamId)
    .filter((s) => inDateRange(s.date, filters.dateFrom, filters.dateTo))
    .sort((a, b) => a.date.localeCompare(b.date));

  const sessionIds = filtered.map((s) => s.id);
  const attendanceRateBySession = new Map<string, number>();
  if (sessionIds.length > 0) {
    const { data: scheduled } = await supabase
      .from("scheduled_trainings" as any)
      .select("id, session_id")
      .in("session_id", sessionIds);
    const scheduledRows = (scheduled ?? []) as { id: string; session_id: string }[];
    const scheduledIds = scheduledRows.map((s) => s.id);
    const sessionByScheduled = new Map(scheduledRows.map((s) => [s.id, s.session_id]));

    if (scheduledIds.length > 0) {
      const { data: attendance } = await supabase
        .from("attendance_records" as any)
        .select("scheduled_training_id, status")
        .in("scheduled_training_id", scheduledIds);
      const tally = new Map<string, { total: number; present: number }>();
      for (const a of (attendance ?? []) as { scheduled_training_id: string; status: string }[]) {
        const sessionId = sessionByScheduled.get(a.scheduled_training_id);
        if (!sessionId) continue;
        const entry = tally.get(sessionId) ?? { total: 0, present: 0 };
        entry.total += 1;
        if (PRESENT_STATUSES.has(a.status)) entry.present += 1;
        tally.set(sessionId, entry);
      }
      for (const [sessionId, t] of tally) {
        attendanceRateBySession.set(sessionId, t.total ? Math.round((t.present / t.total) * 100) : 0);
      }
    }
  }

  const wb = createBrandedWorkbook(branding);
  const sheet = wb.addWorksheet("Trainings");
  const r = addBrandedHeader(wb, sheet, branding, "Training Statistics");
  addTable(
    sheet,
    r,
    [
      { header: "Date" }, { header: "Name" }, { header: "Age group" }, { header: "Team" },
      { header: "Duration (min)" }, { header: "Exercises" }, { header: "Attendance rate %" },
    ],
    filtered.map((s) => [
      s.date,
      s.name,
      s.ageGroup,
      s.teamId ? teamName.get(s.teamId) ?? "" : "",
      s.totalDuration,
      s.exercises.length,
      attendanceRateBySession.get(s.id) ?? "",
    ]),
  );

  await downloadWorkbook(wb, `TrainingStatistics_${slug(branding.name)}.xlsx`);
}
