import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Pencil, Trophy } from "lucide-react";
import { format, parseISO } from "date-fns";
import { PageShell } from "@/components/PageShell";
import { useActiveClub, useClubPermissions } from "@/hooks/useClubs";
import { useMatch, MATCH_TYPE_LABEL } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import { MatchForm } from "@/components/matches/MatchForm";
import { SquadSelector } from "@/components/matches/SquadSelector";
import { LineupEditor } from "@/components/matches/LineupEditor";
import { MatchReportForm } from "@/components/matches/MatchReportForm";
import { AvailabilityPanel } from "@/components/matches/AvailabilityPanel";
import { MatchPreparation } from "@/components/matches/MatchPreparation";

type Tab = "overview" | "availability" | "preparation" | "squad" | "lineup" | "report";

const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  availability: "Availability",
  preparation: "Preparation",
  squad: "Squad",
  lineup: "Lineup",
  report: "Report",
};

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { active } = useActiveClub();
  const perms = useClubPermissions(active?.id ?? null);
  const { data: match, isLoading } = useMatch(id ?? null);
  const { data: teams = [] } = useTeams(active?.id ?? null);
  const [tab, setTab] = useState<Tab>("overview");
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <PageShell title="Match"><p className="text-sm text-muted-foreground">Loading...</p></PageShell>;
  if (!match || !active) return <PageShell title="Match"><p className="text-sm text-muted-foreground">Not found.</p></PageShell>;

  const team = teams.find((t) => t.id === match.team_id);

  return (
    <PageShell title={`vs ${match.opponent}`} subtitle={`${MATCH_TYPE_LABEL[match.match_type]} · ${match.venue === "home" ? "Home" : "Away"}${team ? ` · ${team.name}` : ""}`}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Link to="/club/matches" className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm">
          <ArrowLeft className="w-4 h-4" /> Matches
        </Link>
        {perms.canCreate && (
          <button onClick={() => setEditOpen(true)} className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4 grid sm:grid-cols-3 gap-3 text-sm">
        <Info icon={Calendar} label="Date" value={`${format(parseISO(match.match_date), "EEE d MMM yyyy")}${match.kickoff_time ? ` · ${match.kickoff_time.slice(0, 5)}` : ""}`} />
        <Info icon={MapPin} label="Location" value={match.location ?? "—"} />
        <Info icon={Trophy} label="Competition" value={match.competition ?? "—"} />
      </div>

      {match.notes && (
        <div className="bg-card border border-border rounded-lg p-4 mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Notes</h3>
          <p className="text-sm whitespace-pre-wrap">{match.notes}</p>
        </div>
      )}

      <div className="border-b border-border mb-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {(["overview", "availability", "preparation", "squad", "lineup", "report"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 h-10 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Use the tabs above to manage player availability, add match preparation notes, select the squad, build the lineup, and complete the match report.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            {(["availability", "preparation", "squad", "lineup", "report"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="text-left bg-card border border-border rounded-lg p-3 hover:border-primary/40 transition-colors"
              >
                <p className="text-sm font-medium">{TAB_LABELS[t]}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t === "availability" && "Track who can play"}
                  {t === "preparation" && "Tactics & objectives"}
                  {t === "squad" && "Select the matchday squad"}
                  {t === "lineup" && "Build the starting 11"}
                  {t === "report" && "Post-match analysis"}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
      {tab === "availability" && (
        <AvailabilityPanel matchId={match.id} clubId={active.id} teamId={match.team_id} canManage={perms.canCreate} />
      )}
      {tab === "preparation" && (
        <MatchPreparation matchId={match.id} canEdit={perms.canCreate} />
      )}
      {tab === "squad" && <SquadSelector matchId={match.id} clubId={active.id} teamId={match.team_id} canEdit={perms.canCreate} />}
      {tab === "lineup" && <LineupEditor matchId={match.id} clubId={active.id} teamId={match.team_id} canEdit={perms.canCreate} />}
      {tab === "report" && <MatchReportForm matchId={match.id} clubId={active.id} teamId={match.team_id} canEdit={perms.canCreate} />}

      {editOpen && <MatchForm clubId={active.id} existing={match} onClose={() => setEditOpen(false)} />}
    </PageShell>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1"><Icon className="w-3 h-3" /> {label}</p>
      <p className="font-medium truncate">{value}</p>
    </div>
  );
}
