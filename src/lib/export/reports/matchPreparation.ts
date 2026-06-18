import { getClubBranding } from "../branding";
import { fetchMatch, fetchMatchPreparation } from "../fetchers";
import { createBrandedDoc, addHeading, addParagraph, ensureSpace, finishPdf, startY } from "../pdf";
import { slug } from "../download";
import type { ExportFilters } from "../types";

export async function exportMatchPreparationPdf(clubId: string, filters: ExportFilters) {
  if (!filters.matchId) throw new Error("Select a match to export");
  const [branding, match, prep] = await Promise.all([
    getClubBranding(clubId),
    fetchMatch(filters.matchId),
    fetchMatchPreparation(filters.matchId),
  ]);
  if (!match) throw new Error("Match not found");

  const doc = createBrandedDoc(branding, "Match Preparation");
  let y = startY(doc);
  y = addHeading(doc, `vs ${match.opponent} — ${match.match_date}${match.kickoff_time ? ` ${match.kickoff_time}` : ""}`, y);
  y = addParagraph(
    doc,
    [
      match.competition ? `Competition: ${match.competition}` : null,
      `Venue: ${match.venue === "home" ? "Home" : "Away"}${match.location ? ` (${match.location})` : ""}`,
    ]
      .filter(Boolean)
      .join("   "),
    y,
  );

  const sections: [string, string | null][] = [
    ["Match objectives", prep?.match_objectives ?? null],
    ["Tactical notes", prep?.tactical_notes ?? null],
    ["Opponent analysis", prep?.opponent_analysis ?? null],
    ["Key focus points", prep?.key_focus_points ?? null],
    ["Coach notes", prep?.coach_notes ?? null],
  ];

  for (const [title, content] of sections) {
    y = ensureSpace(doc, y, 50);
    y = addHeading(doc, title, y + 6);
    y = addParagraph(doc, content?.trim() || "—", y);
  }

  finishPdf(doc, `MatchPreparation_${slug(match.opponent)}_${match.match_date}.pdf`);
}
