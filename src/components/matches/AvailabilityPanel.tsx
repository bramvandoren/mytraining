import { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle, AlertTriangle, Send, RefreshCw } from "lucide-react";
import {
  useAvailability,
  useUpsertAvailability,
  useRequestAvailability,
  AVAILABILITY_STATUS_LABEL,
  type AvailabilityStatus,
} from "@/hooks/useAvailability";
import { usePlayers } from "@/hooks/usePlayers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  AvailabilityStatus,
  { icon: typeof CheckCircle2; active: string; inactive: string }
> = {
  available: {
    icon: CheckCircle2,
    active: "bg-emerald-500 text-white border-emerald-500",
    inactive: "border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-500",
  },
  unavailable: {
    icon: XCircle,
    active: "bg-rose-500 text-white border-rose-500",
    inactive: "border-border text-muted-foreground hover:border-rose-400 hover:text-rose-500",
  },
  unsure: {
    icon: HelpCircle,
    active: "bg-amber-500 text-white border-amber-500",
    inactive: "border-border text-muted-foreground hover:border-amber-400 hover:text-amber-500",
  },
  injured: {
    icon: AlertTriangle,
    active: "bg-orange-500 text-white border-orange-500",
    inactive: "border-border text-muted-foreground hover:border-orange-400 hover:text-orange-500",
  },
};

const STATUSES: AvailabilityStatus[] = ["available", "unavailable", "unsure", "injured"];

interface Props {
  matchId: string;
  clubId: string;
  teamId?: string | null;
  canManage: boolean;
}

export function AvailabilityPanel({ matchId, clubId, teamId, canManage }: Props) {
  const { data: records = [], isLoading } = useAvailability("match", matchId);
  const { data: allPlayers = [] } = usePlayers(clubId);
  const upsert = useUpsertAvailability();
  const requestAll = useRequestAvailability();
  const [updating, setUpdating] = useState<string | null>(null);

  const players = teamId
    ? allPlayers.filter((p) => (p as any).team_id === teamId)
    : allPlayers;

  const byPlayer = Object.fromEntries(records.map((r) => [r.player_id, r]));

  const counts = STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: records.filter((r) => r.status === s).length }),
    {} as Record<AvailabilityStatus, number>,
  );

  async function handleSetStatus(playerId: string, status: AvailabilityStatus) {
    setUpdating(playerId);
    try {
      await upsert.mutateAsync({
        club_id: clubId,
        event_type: "match",
        event_id: matchId,
        player_id: playerId,
        status,
      });
    } catch {
      toast.error("Failed to update availability");
    } finally {
      setUpdating(null);
    }
  }

  async function handleRequestAll() {
    const allIds = allPlayers.map((p) => p.id);
    try {
      await requestAll.mutateAsync({
        club_id: clubId,
        event_type: "match",
        event_id: matchId,
        player_ids: allIds,
      });
      toast.success(`Availability requested for ${allIds.length} players`);
    } catch {
      toast.error("Failed to request availability");
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATUSES.map((s) => {
          const { icon: Icon, active } = STATUS_CONFIG[s];
          return (
            <div key={s} className="bg-card border border-border rounded-lg p-3 text-center">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2", active)}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-semibold tabular-nums">{counts[s]}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{AVAILABILITY_STATUS_LABEL[s]}</p>
            </div>
          );
        })}
      </div>

      {canManage && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRequestAll}
            disabled={requestAll.isPending || allPlayers.length === 0}
            className="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Request from all players
          </button>
        </div>
      )}

      {/* Player rows */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading…
          </div>
        )}
        {!isLoading && allPlayers.length === 0 && (
          <p className="text-sm text-muted-foreground p-4 text-center">No players in this club yet.</p>
        )}
        {!isLoading && allPlayers.length > 0 && (
          <ul className="divide-y divide-border">
            {allPlayers.map((player) => {
              const record = byPlayer[player.id];
              const currentStatus = record?.status as AvailabilityStatus | undefined;
              const isUpdating = updating === player.id;

              return (
                <li key={player.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {player.first_name[0]}
                      {player.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {player.first_name} {player.last_name}
                      </p>
                      {(player as any).jersey_number && (
                        <p className="text-xs text-muted-foreground">
                          #{(player as any).jersey_number}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {STATUSES.map((s) => {
                      const { icon: Icon, active, inactive } = STATUS_CONFIG[s];
                      const isActive = currentStatus === s;
                      return (
                        <button
                          key={s}
                          title={AVAILABILITY_STATUS_LABEL[s]}
                          disabled={!canManage || isUpdating}
                          onClick={() => canManage && handleSetStatus(player.id, s)}
                          className={cn(
                            "w-8 h-8 rounded-full border flex items-center justify-center transition-all",
                            isActive ? active : inactive,
                            !canManage ? "cursor-default" : "",
                            isUpdating ? "opacity-40" : "",
                          )}
                        >
                          <Icon className="w-4 h-4" />
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

      <p className="text-xs text-muted-foreground">
        Click a status icon to update a player's availability for this match.
      </p>
    </div>
  );
}
