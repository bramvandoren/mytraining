import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Trophy, MapPin, Calendar, Copy, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useActiveClub, useClubPermissions } from "@/hooks/useClubs";
import { useTeams } from "@/hooks/useTeams";
import {
  useMatches, useDuplicateMatch, useDeleteMatch, MATCH_TYPE_LABEL, type Match,
} from "@/hooks/useMatches";
import { MatchForm } from "@/components/matches/MatchForm";
import { format, parseISO, isAfter } from "date-fns";

export default function MatchesPage() {
  const { active } = useActiveClub();
  const perms = useClubPermissions(active?.id ?? null);
  const { data: matches = [] } = useMatches(active?.id ?? null);
  const { data: teams = [] } = useTeams(active?.id ?? null);
  const dup = useDuplicateMatch();
  const del = useDeleteMatch();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const teamName = (id: string | null) => teams.find((t) => t.id === id)?.name ?? "";

  const filtered = useMemo(() => {
    const today = new Date();
    return matches.filter((m) => {
      const d = parseISO(m.match_date);
      const isUpcoming = isAfter(d, today) || d.toDateString() === today.toDateString();
      return tab === "upcoming" ? isUpcoming : !isUpcoming;
    });
  }, [matches, tab]);

  if (!active) return <PageShell title="Matches"><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;

  return (
    <PageShell title="Matches" subtitle={`${matches.length} total`}>
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="inline-flex p-0.5 bg-muted rounded-md">
          {(["upcoming", "past"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 h-8 text-xs font-medium rounded ${tab === t ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              {t === "upcoming" ? "Upcoming" : "Past"}
            </button>
          ))}
        </div>
        {perms.canCreate && (
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" /> New match
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Trophy className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No {tab} matches.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((m) => (
            <li key={m.id} className="bg-card border border-border rounded-lg hover:border-primary/40 transition-colors">
              <div className="p-4 flex items-center gap-4">
                <Link to={`/club/matches/${m.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {MATCH_TYPE_LABEL[m.match_type]}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {m.venue}
                    </span>
                    {m.team_id && <span className="text-[10px] text-muted-foreground">· {teamName(m.team_id)}</span>}
                  </div>
                  <p className="text-sm font-semibold truncate">vs {m.opponent}</p>
                  <p className="text-xs text-muted-foreground flex items-center flex-wrap gap-3 mt-1">
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(parseISO(m.match_date), "EEE d MMM")}{m.kickoff_time && ` · ${m.kickoff_time.slice(0, 5)}`}</span>
                    {m.location && <span className="inline-flex items-center gap-1 truncate"><MapPin className="w-3 h-3" /> {m.location}</span>}
                    {m.competition && <span>· {m.competition}</span>}
                  </p>
                </Link>
                {perms.canCreate && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(m); setShowForm(true); }} className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={async () => { try { await dup.mutateAsync(m); toast.success("Duplicated"); } catch (e: any) { toast.error(e.message); } }}
                      className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground" title="Duplicate">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {perms.canEdit && (
                      <button
                        onClick={async () => { if (!confirm("Delete this match?")) return; try { await del.mutateAsync({ id: m.id, clubId: m.club_id }); toast.success("Deleted"); } catch (e: any) { toast.error(e.message); } }}
                        className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && <MatchForm clubId={active.id} existing={editing} onClose={() => setShowForm(false)} />}
    </PageShell>
  );
}
