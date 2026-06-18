import { getClubBranding } from "../branding";
import { fetchClubAttendance, type ClubAttendanceRow } from "../fetchers";
import { createBrandedDoc, addHeading, addTable, finishPdf, startY } from "../pdf";
import { createBrandedWorkbook, addBrandedHeader, addTable as addExcelTable, downloadWorkbook } from "../excel";
import { downloadCsv } from "../csv";
import { slug } from "../download";
import type { ExportFilters } from "../types";

const PRESENT_STATUSES = new Set(["present", "late"]);

async function getFilteredRows(clubId: string, filters: ExportFilters): Promise<ClubAttendanceRow[]> {
  const rows = await fetchClubAttendance(clubId, { dateFrom: filters.dateFrom ?? undefined, dateTo: filters.dateTo ?? undefined });
  return rows.filter((r) => !filters.teamId || r.team_id === filters.teamId);
}

function summarize(rows: ClubAttendanceRow[]) {
  const byPlayer = new Map<string, { name: string; total: number; present: number }>();
  for (const r of rows) {
    const entry = byPlayer.get(r.player_id) ?? { name: r.player_name, total: 0, present: 0 };
    entry.total += 1;
    if (PRESENT_STATUSES.has(r.status)) entry.present += 1;
    byPlayer.set(r.player_id, entry);
  }
  return [...byPlayer.values()]
    .map((p) => ({ ...p, rate: p.total ? Math.round((p.present / p.total) * 100) : 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function exportAttendancePdf(clubId: string, filters: ExportFilters) {
  const [branding, rows] = await Promise.all([getClubBranding(clubId), getFilteredRows(clubId, filters)]);
  const summary = summarize(rows);

  const doc = createBrandedDoc(branding, "Attendance Report");
  let y = startY(doc);
  y = addHeading(doc, "Attendance rate by player", y);
  addTable(
    doc,
    y,
    [["Player", "Sessions", "Present", "Rate"]],
    summary.length ? summary.map((s) => [s.name, String(s.total), String(s.present), `${s.rate}%`]) : [["—", "—", "—", "—"]],
  );
  y = startY(doc);

  y = addHeading(doc, "Session log", y + 6);
  const sessionRows = rows
    .slice()
    .sort((a, b) => (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? ""))
    .map((r) => [r.scheduled_date ?? "—", r.session_name ?? "—", r.player_name, r.status]);
  addTable(doc, y, [["Date", "Session", "Player", "Status"]], sessionRows.length ? sessionRows : [["—", "—", "—", "—"]]);

  finishPdf(doc, `AttendanceReport_${slug(branding.name)}.pdf`);
}

export async function exportAttendanceExcel(clubId: string, filters: ExportFilters) {
  const [branding, rows] = await Promise.all([getClubBranding(clubId), getFilteredRows(clubId, filters)]);
  const summary = summarize(rows);

  const wb = createBrandedWorkbook(branding);
  const summarySheet = wb.addWorksheet("Summary");
  let r = addBrandedHeader(wb, summarySheet, branding, "Attendance Report — Summary");
  addExcelTable(
    summarySheet,
    r,
    [{ header: "Player" }, { header: "Sessions" }, { header: "Present" }, { header: "Rate %" }],
    summary.map((s) => [s.name, s.total, s.present, s.rate]),
  );

  const logSheet = wb.addWorksheet("Session log");
  r = addBrandedHeader(wb, logSheet, branding, "Attendance Report — Session log");
  addExcelTable(
    logSheet,
    r,
    [{ header: "Date" }, { header: "Session" }, { header: "Player" }, { header: "Status" }],
    rows.map((row) => [row.scheduled_date ?? "", row.session_name ?? "", row.player_name, row.status]),
  );

  await downloadWorkbook(wb, `AttendanceReport_${slug(branding.name)}.xlsx`);
}

export async function exportAttendanceCsv(clubId: string, filters: ExportFilters) {
  const rows = await getFilteredRows(clubId, filters);
  downloadCsv(
    "AttendanceData.csv",
    ["Date", "Session", "Player", "Status", "Note"],
    rows.map((r) => [r.scheduled_date ?? "", r.session_name ?? "", r.player_name, r.status, r.note ?? ""]),
  );
}
