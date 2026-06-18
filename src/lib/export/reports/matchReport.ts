import { getClubBranding } from "../branding";
import { fetchMatch, fetchMatchReport, fetchMatchEvents, fetchMatchSquad, fetchPlayers } from "../fetchers";
import { createBrandedDoc, addHeading, addParagraph, addTable, ensureSpace, finishPdf, startY } from "../pdf";
import { slug } from "../download";
import type { ExportFilters } from "../types";

const EVENT_LABEL: Record<string, string> = {
  goal: "Goal",
  assist: "Assist",
  yellow_card: "Yellow card",
  red_card: "Red card",
};

export async function exportMatchReportPdf(clubId: string, filters: ExportFilters) {
  if (!filters.matchId) throw new Error("Select a match to export");
  const [branding, match, report, events, squad, players] = await Promise.all([
    getClubBranding(clubId),
    fetchMatch(filters.matchId),
    fetchMatchReport(filters.matchId),
    fetchMatchEvents(filters.matchId),
    fetchMatchSquad(filters.matchId),
    fetchPlayers(clubId, { includeArchived: true }),
  ]);
  if (!match) throw new Error("Match not found");
  const playerName = new Map(players.map((p) => [p.id, `${p.first_name} ${p.last_name}`]));

  const doc = createBrandedDoc(branding, "Match Report");
  let y = startY(doc);
  y = addHeading(
    doc,
    `${match.venue === "home" ? "Home" : "Away"} vs ${match.opponent} — ${match.match_date}`,
    y,
  );

  const score = report?.our_score != null && report?.opp_score != null ? `${report.our_score} - ${report.opp_score}` : "Not recorded";
  const htScore = report?.ht_our_score != null && report?.ht_opp_score != null ? ` (HT ${report.ht_our_score}-${report.ht_opp_score})` : "";
  y = addParagraph(doc, `Final score: ${score}${htScore}`, y);

  y = ensureSpace(doc, y, 60);
  y = addHeading(doc, "Squad", y + 6);
  const squadRows = squad
    .map((s) => [playerName.get(s.player_id) ?? s.player_id, s.is_starter ? "Starter" : "Bench", s.shirt_number?.toString() ?? "", s.status])
    .sort((a, b) => a[0].localeCompare(b[0]));
  addTable(doc, y, [["Player", "Role", "Shirt #", "Status"]], squadRows.length ? squadRows : [["—", "—", "—", "—"]]);
  y = startY(doc);

  y = ensureSpace(doc, y, 60);
  y = addHeading(doc, "Match events", y + 6);
  const eventRows = events.map((e) => [
    e.minute != null ? `${e.minute}'` : "—",
    EVENT_LABEL[e.event_type] ?? e.event_type,
    e.player_id ? playerName.get(e.player_id) ?? e.player_id : "—",
    e.note ?? "",
  ]);
  addTable(doc, y, [["Minute", "Event", "Player", "Note"]], eventRows.length ? eventRows : [["—", "—", "—", "—"]]);
  y = startY(doc);

  const reviewSections: [string, string | null][] = [
    ["What went well", report?.what_went_well ?? null],
    ["What to improve", report?.what_to_improve ?? null],
    ["Next training focus", report?.next_training_focus ?? null],
  ];
  for (const [title, content] of reviewSections) {
    y = ensureSpace(doc, y, 50);
    y = addHeading(doc, title, y + 6);
    y = addParagraph(doc, content?.trim() || "—", y);
  }

  finishPdf(doc, `MatchReport_${slug(match.opponent)}_${match.match_date}.pdf`);
}
