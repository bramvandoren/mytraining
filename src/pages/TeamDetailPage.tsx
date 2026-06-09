import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Printer, Users } from "lucide-react";
import { differenceInYears, parseISO } from "date-fns";
import { PageShell } from "@/components/PageShell";
import { useActiveClub, useClubPermissions } from "@/hooks/useClubs";
import { useTeams } from "@/hooks/useTeams";
import { useTeamRoster, POSITION_SHORT, type PlayerPosition } from "@/hooks/usePlayers";
import { PlayerCard } from "@/components/players/PlayerCard";
import { PlayerForm } from "@/components/players/PlayerForm";

const POSITIONS: PlayerPosition[] = ["gk", "def", "mid", "fwd"];

type SortKey = "name" | "position" | "jersey";

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { active } = useActiveClub();
  const perms = useClubPermissions(active?.id ?? null);
  const { data: teams = [] } = useTeams(active?.id ?? null);
  const team = teams.find((t) => t.id === id);
  const { data: roster = [], isLoading } = useTeamRoster(id ?? null);
  const [sort, setSort] = useState<SortKey>("name");
  const [adding, setAdding] = useState(false);

  const sorted = useMemo(() => {
    const r = [...roster];
    if (sort === "jersey") r.sort((a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999));
    else if (sort === "position") {
      const order: Record<string, number> = { gk: 0, def: 1, mid: 2, fwd: 3 };
      r.sort((a, b) => (order[a.position ?? "z"] ?? 9) - (order[b.position ?? "z"] ?? 9));
    } else r.sort((a, b) => a.last_name.localeCompare(b.last_name));
    return r;
  }, [roster, sort]);

  const stats = useMemo(() => {
    const ages = roster
      .filter((p) => p.birth_date)
      .map((p) => differenceInYears(new Date(), parseISO(p.birth_date!)));
    const avg = ages.length ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : null;
    const breakdown: Record<string, number> = { gk: 0, def: 0, mid: 0, fwd: 0, none: 0 };
    roster.forEach((p) => {
      breakdown[p.position ?? "none"] = (breakdown[p.position ?? "none"] ?? 0) + 1;
    });
    return { size: roster.length, avgAge: avg, breakdown };
  }, [roster]);

  if (!active) return <PageShell title="Team"><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;
  if (!team) return <PageShell title="Team"><p className="text-sm text-muted-foreground">Team not found.</p></PageShell>;

  return (
    <PageShell title={team.name} subtitle={team.age_category ?? "Squad"}>
      <div className="flex flex-wrap items-center gap-2 mb-4 print:hidden">
        <Link to="/club/teams" className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm">
          <ArrowLeft className="w-4 h-4" /> All teams
        </Link>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-9 px-2 rounded-md bg-muted border border-border text-sm outline-none">
          <option value="name">Sort: Name</option>
          <option value="position">Sort: Position</option>
          <option value="jersey">Sort: Jersey #</option>
        </select>
        <button onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm">
          <Printer className="w-4 h-4" /> Print roster
        </button>
        {perms.canCreate && (
          <button onClick={() => setAdding(true)}
            className="ml-auto inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            <Plus className="w-4 h-4" /> Add player
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Squad size" value={stats.size} />
        <Stat label="Avg age" value={stats.avgAge ?? "—"} />
        {POSITIONS.map((p) => (
          <Stat key={p} label={POSITION_SHORT[p]} value={stats.breakdown[p] ?? 0} />
        )).slice(0, 2)}
      </div>
      <div className="grid grid-cols-4 gap-3 mb-6 text-xs">
        {POSITIONS.map((p) => (
          <div key={p} className="bg-muted/40 rounded-md px-2 py-1.5 text-center">
            <p className="text-muted-foreground">{POSITION_SHORT[p]}</p>
            <p className="font-semibold tabular-nums">{stats.breakdown[p] ?? 0}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sorted.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No players in this squad yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {sorted.map((p) => <PlayerCard key={p.id} player={p} />)}
        </div>
      )}

      {adding && <PlayerForm clubId={active.id} defaultTeamId={team.id} onClose={() => setAdding(false)} />}
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums mt-1">{value}</p>
    </div>
  );
}
