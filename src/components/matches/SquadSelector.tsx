import { useMemo } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import {
  useMatchSquad, useUpsertSquadEntry,
  SQUAD_STATUS_COLOR, SQUAD_STATUS_LABEL, type SquadStatus,
} from "@/hooks/useMatches";
import { usePlayers, useTeamRoster, POSITION_SHORT, type Player } from "@/hooks/usePlayers";

const STATUSES: SquadStatus[] = ["selected", "not_selected", "injured", "suspended"];

export function SquadSelector({ matchId, clubId, teamId, canEdit }: { matchId: string; clubId: string; teamId: string | null; canEdit: boolean }) {
  const { data: squad = [] } = useMatchSquad(matchId);
  const { data: roster = [] } = useTeamRoster(teamId);
  const { data: all = [] } = usePlayers(clubId);
  const players: Player[] = teamId ? roster : all;
  const upsert = useUpsertSquadEntry();

  const byPlayer = useMemo(() => {
    const m = new Map<string, { status: SquadStatus; is_starter: boolean }>();
    squad.forEach((s) => m.set(s.player_id, { status: s.status, is_starter: s.is_starter }));
    return m;
  }, [squad]);

  const counts = useMemo(() => {
    const c = { selected: 0, starters: 0, injured: 0, suspended: 0 };
    squad.forEach((s) => {
      if (s.status === "selected") c.selected++;
      if (s.is_starter) c.starters++;
      if (s.status === "injured") c.injured++;
      if (s.status === "suspended") c.suspended++;
    });
    return c;
  }, [squad]);

  const setStatus = async (playerId: string, status: SquadStatus) => {
    const current = byPlayer.get(playerId);
    try {
      await upsert.mutateAsync({
        match_id: matchId, player_id: playerId, status,
        is_starter: status === "selected" ? current?.is_starter ?? false : false,
      });
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleStarter = async (playerId: string) => {
    const current = byPlayer.get(playerId);
    if (!current || current.status !== "selected") return;
    try {
      await upsert.mutateAsync({
        match_id: matchId, player_id: playerId, status: "selected",
        is_starter: !current.is_starter,
      });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Stat label="Selected" value={counts.selected} />
        <Stat label="Starters" value={counts.starters} />
        <Stat label="Injured" value={counts.injured} />
        <Stat label="Suspended" value={counts.suspended} />
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No players in this {teamId ? "team" : "club"}.</p>
      ) : (
        <ul className="space-y-2">
          {players.map((p) => {
            const cur = byPlayer.get(p.id);
            const status = cur?.status ?? "not_selected";
            return (
              <li key={p.id} className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.first_name} {p.last_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.position ? POSITION_SHORT[p.position] : "—"}
                      {p.jersey_number != null && ` · #${p.jersey_number}`}
                    </p>
                  </div>
                  {status === "selected" && (
                    <button
                      disabled={!canEdit} onClick={() => toggleStarter(p.id)}
                      className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
                        cur?.is_starter ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                      } disabled:opacity-50`}
                      title="Toggle starter"
                    >
                      <Star className="w-4 h-4" fill={cur?.is_starter ? "currentColor" : "none"} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {STATUSES.map((s) => {
                    const active = status === s;
                    return (
                      <button
                        key={s} disabled={!canEdit}
                        onClick={() => setStatus(p.id, s)}
                        className={`h-9 rounded-md text-xs font-medium transition-all ${
                          active ? SQUAD_STATUS_COLOR[s] + " shadow" : "bg-muted text-muted-foreground hover:bg-muted/70"
                        } disabled:opacity-50`}
                      >
                        {SQUAD_STATUS_LABEL[s]}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-md px-2 py-2 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
