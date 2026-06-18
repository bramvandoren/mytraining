import { getClubBranding } from "../branding";
import { fetchTrainingSessionsForExport, fetchTeams } from "../fetchers";
import { createBrandedDoc, addHeading, addTable, addParagraph, ensureSpace, finishPdf, startY } from "../pdf";
import { slug } from "../download";
import type { ExportFilters } from "../types";
import { inDateRange } from "../types";

export async function exportTrainingsPdf(clubId: string, filters: ExportFilters) {
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

  const doc = createBrandedDoc(branding, "Trainings");
  let y = startY(doc);

  if (filtered.length === 0) {
    addParagraph(doc, "No training sessions match the selected filters.", y);
  }

  for (const session of filtered) {
    y = ensureSpace(doc, y, 80);
    y = addHeading(
      doc,
      `${session.name} — ${session.date}${session.teamId ? ` · ${teamName.get(session.teamId) ?? "Team"}` : ""} · ${session.ageGroup}`,
      y,
    );
    const rows = [...session.exercises]
      .sort((a, b) => a.order - b.order)
      .map((e) => [e.exercise.title, e.exercise.type, `${e.exercise.duration} min`, String(e.exercise.players), e.notes || ""]);
    addTable(doc, y, [["Exercise", "Type", "Duration", "Players", "Notes"]], rows.length ? rows : [["—", "—", "—", "—", "—"]]);
    y = startY(doc);
  }

  finishPdf(doc, `Trainings_${slug(branding.name)}.pdf`);
}
