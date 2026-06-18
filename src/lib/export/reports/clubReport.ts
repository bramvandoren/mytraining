import { getClubBranding } from "../branding";
import { fetchClubOverview, fetchClubAttendance, fetchClubActivity } from "../fetchers";
import { createBrandedWorkbook, addBrandedHeader, addTable, downloadWorkbook } from "../excel";
import { slug } from "../download";
import type { ExportFilters } from "../types";

const PRESENT_STATUSES = new Set(["present", "late"]);

export async function exportClubReportExcel(clubId: string, filters: ExportFilters) {
  const [branding, overview, attendance, activity] = await Promise.all([
    getClubBranding(clubId),
    fetchClubOverview(clubId),
    fetchClubAttendance(clubId, { dateFrom: filters.dateFrom ?? undefined, dateTo: filters.dateTo ?? undefined }),
    fetchClubActivity(clubId, { dateFrom: filters.dateFrom ?? undefined, dateTo: filters.dateTo ?? undefined }),
  ]);

  const wb = createBrandedWorkbook(branding);

  const overviewSheet = wb.addWorksheet("Overview");
  let r = addBrandedHeader(wb, overviewSheet, branding, "Club Report — Overview");
  addTable(
    overviewSheet,
    r,
    [{ header: "Metric" }, { header: "Count" }],
    [
      ["Teams", overview.teams],
      ["Active players", overview.players],
      ["Coaches", overview.coaches],
      ["Training sessions", overview.trainings],
      ["Matches", overview.matches],
    ],
  );

  const attendanceSheet = wb.addWorksheet("Attendance");
  r = addBrandedHeader(wb, attendanceSheet, branding, "Club Report — Attendance");
  const breakdown = new Map<string, number>();
  let present = 0;
  for (const row of attendance) {
    breakdown.set(row.status, (breakdown.get(row.status) ?? 0) + 1);
    if (PRESENT_STATUSES.has(row.status)) present += 1;
  }
  const rate = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  addTable(
    attendanceSheet,
    r,
    [{ header: "Status" }, { header: "Count" }],
    [...breakdown.entries(), ["Overall rate", `${rate}%`]],
  );

  const activitySheet = wb.addWorksheet("Activity log");
  r = addBrandedHeader(wb, activitySheet, branding, "Club Report — Activity log");
  addTable(
    activitySheet,
    r,
    [{ header: "Date" }, { header: "Action" }, { header: "Entity" }],
    activity.map((a) => [new Date(a.created_at).toLocaleString(), a.action, a.entity_type ?? ""]),
  );

  await downloadWorkbook(wb, `ClubReport_${slug(branding.name)}.xlsx`);
}
