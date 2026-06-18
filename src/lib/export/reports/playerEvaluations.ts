import { getClubBranding } from "../branding";
import { fetchPlayerEvaluations, fetchPlayers } from "../fetchers";
import { createBrandedDoc, addHeading, addParagraph, ensureSpace, finishPdf, startY } from "../pdf";
import { slug } from "../download";
import type { ExportFilters } from "../types";
import { inDateRange } from "../types";

const RATING_LABELS: [string, string][] = [
  ["technical_rating", "Technical"],
  ["tactical_rating", "Tactical"],
  ["physical_rating", "Physical"],
  ["mental_rating", "Mental"],
  ["overall_rating", "Overall"],
];

export async function exportPlayerEvaluationsPdf(clubId: string, filters: ExportFilters) {
  if (!filters.playerId) throw new Error("Select a player to export");
  const [branding, evaluations, players] = await Promise.all([
    getClubBranding(clubId),
    fetchPlayerEvaluations(filters.playerId),
    fetchPlayers(clubId, { includeArchived: true }),
  ]);
  const player = players.find((p) => p.id === filters.playerId);
  const filtered = evaluations.filter((e) => inDateRange(e.evaluation_date, filters.dateFrom, filters.dateTo));

  const doc = createBrandedDoc(branding, "Player Evaluations");
  let y = startY(doc);
  y = addHeading(doc, player ? `${player.first_name} ${player.last_name}` : "Player", y);

  if (filtered.length === 0) {
    addParagraph(doc, "No evaluations recorded for the selected period.", y);
  }

  for (const ev of filtered) {
    y = ensureSpace(doc, y, 90);
    y = addHeading(doc, ev.evaluation_date, y + 6);
    const ratings = RATING_LABELS.map(([key, label]) => {
      const value = (ev as any)[key];
      return value != null ? `${label}: ${value}/5` : null;
    })
      .filter(Boolean)
      .join("   ");
    y = addParagraph(doc, ratings || "No ratings recorded", y);
    if (ev.strengths) y = addParagraph(doc, `Strengths: ${ev.strengths}`, y);
    if (ev.areas_to_improve) y = addParagraph(doc, `Areas to improve: ${ev.areas_to_improve}`, y);
    if (ev.coach_notes) y = addParagraph(doc, `Coach notes: ${ev.coach_notes}`, y);
  }

  finishPdf(doc, `PlayerEvaluations_${slug(player ? `${player.first_name}_${player.last_name}` : "player")}.pdf`);
}
