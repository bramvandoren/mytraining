import { getClubBranding } from "../branding";
import { fetchMatches, fetchMatchReport, fetchMatchEvents } from "../fetchers";
import { createBrandedWorkbook, addBrandedHeader, addTable, downloadWorkbook } from "../excel";
import { slug } from "../download";
import type { ExportFilters } from "../types";
import { inDateRange } from "../types";

export async function exportMatchStatisticsExcel(clubId: string, filters: ExportFilters) {
  const [branding, matches] = await Promise.all([getClubBranding(clubId), fetchMatches(clubId)]);
  const filtered = matches
    .filter((m) => !filters.teamId || m.team_id === filters.teamId)
    .filter((m) => inDateRange(m.match_date, filters.dateFrom, filters.dateTo))
    .sort((a, b) => a.match_date.localeCompare(b.match_date));

  const rows = await Promise.all(
    filtered.map(async (m) => {
      const [report, events] = await Promise.all([fetchMatchReport(m.id), fetchMatchEvents(m.id)]);
      const goals = events.filter((e) => e.event_type === "goal").length;
      const yellows = events.filter((e) => e.event_type === "yellow_card").length;
      const reds = events.filter((e) => e.event_type === "red_card").length;
      const result =
        report?.our_score != null && report?.opp_score != null
          ? report.our_score > report.opp_score ? "W" : report.our_score < report.opp_score ? "L" : "D"
          : "";
      return [
        m.match_date,
        m.opponent,
        m.venue === "home" ? "Home" : "Away",
        m.competition ?? "",
        report?.our_score ?? "",
        report?.opp_score ?? "",
        result,
        goals,
        yellows,
        reds,
      ];
    }),
  );

  const wb = createBrandedWorkbook(branding);
  const sheet = wb.addWorksheet("Matches");
  const r = addBrandedHeader(wb, sheet, branding, "Match Statistics");
  addTable(
    sheet,
    r,
    [
      { header: "Date" }, { header: "Opponent" }, { header: "Venue" }, { header: "Competition" },
      { header: "Goals for" }, { header: "Goals against" }, { header: "Result" },
      { header: "Logged goals" }, { header: "Yellow cards" }, { header: "Red cards" },
    ],
    rows,
  );

  await downloadWorkbook(wb, `MatchStatistics_${slug(branding.name)}.xlsx`);
}
