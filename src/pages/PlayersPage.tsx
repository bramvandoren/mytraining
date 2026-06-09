import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { useActiveClub, useClubPermissions } from "@/hooks/useClubs";
import { usePlayers, POSITION_SHORT, type PlayerPosition } from "@/hooks/usePlayers";
import { useTeams } from "@/hooks/useTeams";
import { PlayerCard } from "@/components/players/PlayerCard";
import { PlayerForm } from "@/components/players/PlayerForm";

export default function PlayersPage() {
  const { active } = useActiveClub();
  const perms = useClubPermissions(active?.id ?? null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data: players = [], isLoading } = usePlayers(active?.id ?? null, { includeArchived });
  const { data: teams = [] } = useTeams(active?.id ?? null);
  const [query, setQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [posFilter, setPosFilter] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const teamNameById = useMemo(() => {
    const m = new Map<string, string>();
    teams.forEach((t) => m.set(t.id, t.name));
    return m;
  }, [teams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players.filter((p) => {
      if (q && !`${p.first_name} ${p.last_name}`.toLowerCase().includes(q)) return false;
      if (teamFilter && p.current_team_id !== teamFilter) return false;
      if (posFilter && p.position !== posFilter) return false;
      return true;
    });
  }, [players, query, teamFilter, posFilter]);

  if (!active) return <PageShell title="Players"><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;

  return (
    <PageShell title="Players" subtitle={`${filtered.length} of ${players.length} players`}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search players…"
            className="w-full h-9 pl-8 pr-3 rounded-md bg-muted border border-border text-sm outline-none focus:border-primary" />
        </div>
        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}
          className="h-9 px-2 rounded-md bg-muted border border-border text-sm outline-none">
          <option value="">All teams</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)}
          className="h-9 px-2 rounded-md bg-muted border border-border text-sm outline-none">
          <option value="">All positions</option>
          {(["gk", "def", "mid", "fwd"] as PlayerPosition[]).map((p) => (
            <option key={p} value={p}>{POSITION_SHORT[p]}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
          Show archived
        </label>
        {perms.canCreate && (
          <button onClick={() => setCreating(true)}
            className="ml-auto inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            <Plus className="w-4 h-4" /> Add player
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">No players match your filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {filtered.map((p) => (
            <PlayerCard key={p.id} player={p} teamName={p.current_team_id ? teamNameById.get(p.current_team_id) : undefined} />
          ))}
        </div>
      )}

      {creating && <PlayerForm clubId={active.id} onClose={() => setCreating(false)} />}
    </PageShell>
  );
}
