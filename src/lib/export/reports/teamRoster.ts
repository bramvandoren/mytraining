import { getClubBranding } from "../branding";
import { fetchTeamRoster, fetchTeams } from "../fetchers";
import { createBrandedDoc, addHeading, addTable, finishPdf, startY } from "../pdf";
import { createBrandedWorkbook, addBrandedHeader, addTable as addExcelTable, downloadWorkbook } from "../excel";
import { slug } from "../download";
import type { ExportFilters } from "../types";

const POSITION_LABEL: Record<string, string> = { gk: "Goalkeeper", def: "Defender", mid: "Midfielder", fwd: "Forward" };

async function loadRoster(clubId: string, filters: ExportFilters) {
  if (!filters.teamId) throw new Error("Select a team to export");
  const [branding, roster, teams] = await Promise.all([
    getClubBranding(clubId),
    fetchTeamRoster(filters.teamId),
    fetchTeams(clubId),
  ]);
  const team = teams.find((t) => t.id === filters.teamId);
  const sorted = [...roster].sort((a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999));
  return { branding, team, sorted };
}

export async function exportTeamRosterPdf(clubId: string, filters: ExportFilters) {
  const { branding, team, sorted } = await loadRoster(clubId, filters);

  const doc = createBrandedDoc(branding, "Team Roster");
  let y = startY(doc);
  y = addHeading(doc, team?.name ?? "Team", y);
  addTable(
    doc,
    y,
    [["#", "Name", "Position", "Birth date", "Foot"]],
    sorted.length
      ? sorted.map((p) => [
          p.jersey_number?.toString() ?? "",
          `${p.first_name} ${p.last_name}`,
          p.position ? POSITION_LABEL[p.position] : "",
          p.birth_date ?? "",
          p.preferred_foot ?? "",
        ])
      : [["—", "—", "—", "—", "—"]],
  );

  finishPdf(doc, `TeamRoster_${slug(team?.name ?? "team")}.pdf`);
}

export async function exportTeamPlayerListExcel(clubId: string, filters: ExportFilters) {
  const { branding, team, sorted } = await loadRoster(clubId, filters);

  const wb = createBrandedWorkbook(branding);
  const sheet = wb.addWorksheet("Players");
  const r = addBrandedHeader(wb, sheet, branding, `Team Player List — ${team?.name ?? "Team"}`);
  addExcelTable(
    sheet,
    r,
    [
      { header: "#" }, { header: "First name" }, { header: "Last name" }, { header: "Position" },
      { header: "Birth date" }, { header: "Nationality" }, { header: "Preferred foot" },
    ],
    sorted.map((p) => [
      p.jersey_number ?? "",
      p.first_name,
      p.last_name,
      p.position ? POSITION_LABEL[p.position] : "",
      p.birth_date ?? "",
      p.nationality ?? "",
      p.preferred_foot ?? "",
    ]),
  );

  await downloadWorkbook(wb, `TeamPlayerList_${slug(team?.name ?? "team")}.xlsx`);
}
