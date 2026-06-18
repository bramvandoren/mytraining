import { fetchPlayers, fetchTeams } from "../fetchers";
import { downloadCsv } from "../csv";
import type { ExportFilters } from "../types";

const POSITION_LABEL: Record<string, string> = { gk: "Goalkeeper", def: "Defender", mid: "Midfielder", fwd: "Forward" };

export async function exportPlayerDataCsv(clubId: string, filters: ExportFilters) {
  const [players, teams] = await Promise.all([fetchPlayers(clubId), fetchTeams(clubId)]);
  const teamName = new Map(teams.map((t) => [t.id, t.name]));
  const filtered = players.filter((p) => !filters.teamId || p.current_team_id === filters.teamId);

  downloadCsv(
    "PlayerData.csv",
    ["First name", "Last name", "Team", "Position", "Jersey #", "Birth date", "Nationality", "Preferred foot", "Emergency contact", "Parent contact", "Medical notes"],
    filtered.map((p) => [
      p.first_name,
      p.last_name,
      p.current_team_id ? teamName.get(p.current_team_id) ?? "" : "",
      p.position ? POSITION_LABEL[p.position] : "",
      p.jersey_number ?? "",
      p.birth_date ?? "",
      p.nationality ?? "",
      p.preferred_foot ?? "",
      p.emergency_contact ?? "",
      p.parent_contact ?? "",
      p.medical_notes ?? "",
    ]),
  );
}
