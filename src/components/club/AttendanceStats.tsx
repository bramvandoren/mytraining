import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlayers } from "@/hooks/usePlayers";
import { TrendingUp, Award, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceStat {
  player_id: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  injured: number;
  excused: number;
  rate: number;
}

function useClubAttendanceStats(clubId: string | null) {
  return useQuery({
    queryKey: ["club_attendance_stats", clubId],
    enabled: !!clubId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records" as any)
        .select(
          "player_id, status, players!inner(club_id)",
        )
        .eq("players.club_id" as any, clubId!);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

interface Props {
  clubId: string;
}

export function AttendanceStats({ clubId }: Props) {
  const { data: rawRecords = [], isLoading } = useClubAttendanceStats(clubId);
  const { data: players = [] } = usePlayers(clubId);

  const stats = useMemo<AttendanceStat[]>(() => {
    const map = new Map<string, AttendanceStat>();
    for (const r of rawRecords) {
      if (!map.has(r.player_id)) {
        map.set(r.player_id, {
          player_id: r.player_id,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          injured: 0,
          excused: 0,
          rate: 0,
        });
      }
      const s = map.get(r.player_id)!;
      s.total++;
      if (r.status in s) (s as any)[r.status]++;
    }
    for (const s of map.values()) {
      s.rate = s.total > 0 ? Math.round(((s.present + s.late) / s.total) * 100) : 0;
    }
    return Array.from(map.values()).sort((a, b) => b.rate - a.rate);
  }, [rawRecords]);

  const playersById = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players],
  );

  const totalSessions = useMemo(() => {
    const ids = new Set(rawRecords.map((r: any) => r.scheduled_training_id).filter(Boolean));
    return ids.size || (rawRecords.length > 0 ? 1 : 0);
  }, [rawRecords]);

  const overallRate = useMemo(() => {
    if (stats.length === 0) return 0;
    return Math.round(stats.reduce((sum, s) => sum + s.rate, 0) / stats.length);
  }, [stats]);

  const topPresent = stats.slice(0, 5);
  const mostAbsent = [...stats].sort((a, b) => b.absent - a.absent).slice(0, 3);

  if (isLoading) return <div className="text-sm text-muted-foreground p-4">Loading attendance…</div>;

  if (rawRecords.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No attendance records yet. Start by registering attendance for a training session.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold text-emerald-500">{overallRate}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Avg. attendance rate</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold">{stats.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Players tracked</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-semibold">{rawRecords.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Records total</p>
        </div>
      </div>

      {/* Top attenders */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Most Present</h3>
        </div>
        <ul className="space-y-2">
          {topPresent.map((stat, i) => {
            const player = playersById.get(stat.player_id);
            if (!player) return null;
            return (
              <li key={stat.player_id} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {player.first_name[0]}
                  {player.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {player.first_name} {player.last_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          stat.rate >= 80 ? "bg-emerald-500" : stat.rate >= 60 ? "bg-amber-500" : "bg-rose-500",
                        )}
                        style={{ width: `${stat.rate}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
                      {stat.rate}%
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Attendance concerns */}
      {mostAbsent.some((s) => s.absent > 0) && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-semibold">Most Absences</h3>
          </div>
          <ul className="space-y-2">
            {mostAbsent.filter((s) => s.absent > 0).map((stat) => {
              const player = playersById.get(stat.player_id);
              if (!player) return null;
              return (
                <li key={stat.player_id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {player.first_name[0]}
                      {player.last_name[0]}
                    </div>
                    <p className="text-sm font-medium truncate">
                      {player.first_name} {player.last_name}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-rose-500">
                    {stat.absent} absent
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Full table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">All Players</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground text-xs">Player</th>
                <th className="px-3 py-2 text-center font-medium text-muted-foreground text-xs">Rate</th>
                <th className="px-3 py-2 text-center font-medium text-emerald-600 text-xs">Present</th>
                <th className="px-3 py-2 text-center font-medium text-rose-500 text-xs">Absent</th>
                <th className="px-3 py-2 text-center font-medium text-sky-500 text-xs">Late</th>
                <th className="px-3 py-2 text-center font-medium text-amber-500 text-xs">Injured</th>
                <th className="px-3 py-2 text-center font-medium text-violet-500 text-xs">Excused</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.map((stat) => {
                const player = playersById.get(stat.player_id);
                if (!player) return null;
                return (
                  <tr key={stat.player_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 font-medium">
                      {player.first_name} {player.last_name}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={cn(
                          "font-semibold",
                          stat.rate >= 80 ? "text-emerald-500" : stat.rate >= 60 ? "text-amber-500" : "text-rose-500",
                        )}
                      >
                        {stat.rate}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-emerald-600">{stat.present}</td>
                    <td className="px-3 py-2 text-center text-rose-500">{stat.absent}</td>
                    <td className="px-3 py-2 text-center text-sky-500">{stat.late}</td>
                    <td className="px-3 py-2 text-center text-amber-500">{stat.injured}</td>
                    <td className="px-3 py-2 text-center text-violet-500">{stat.excused}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
