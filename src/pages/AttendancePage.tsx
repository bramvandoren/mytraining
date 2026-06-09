import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useActiveClub, useClubPermissions } from "@/hooks/useClubs";
import { useScheduled } from "@/hooks/useScheduled";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { useTeamRoster, usePlayers, POSITION_SHORT } from "@/hooks/usePlayers";
import {
  useAttendance, useUpsertAttendance, STATUS_META, type AttendanceStatus,
} from "@/hooks/useAttendance";

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "injured", "excused"];

export default function AttendancePage() {
  const { id: scheduledId } = useParams<{ id: string }>();
  const { active } = useActiveClub();
  const perms = useClubPermissions(active?.id ?? null);
  const { data: scheduled = [] } = useScheduled();
  const { data: sessions = [] } = useTrainingSessions();
  const sched = scheduled.find((s) => s.id === scheduledId);
  const session = sessions.find((x) => x.id === sched?.session_id);
  const teamId = (session as any)?.team_id ?? null;

  const { data: roster = [] } = useTeamRoster(teamId);
  const { data: allPlayers = [] } = usePlayers(active?.id ?? null);
  const players = teamId ? roster : allPlayers;

  const { data: attendance = [] } = useAttendance(scheduledId ?? null);
  const upsert = useUpsertAttendance();

  const byPlayer = useMemo(() => {
    const m = new Map<string, AttendanceStatus>();
    attendance.forEach((a) => m.set(a.player_id, a.status));
    return m;
  }, [attendance]);

  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, injured: 0, excused: 0 };
    attendance.forEach((a) => { c[a.status]++; });
    return c;
  }, [attendance]);

  if (!active) return <PageShell title="Attendance"><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;
  if (!sched) return <PageShell title="Attendance"><p className="text-sm text-muted-foreground">Training not found.</p></PageShell>;

  const setStatus = async (playerId: string, status: AttendanceStatus) => {
    try {
      await upsert.mutateAsync({ scheduledId: sched.id, playerId, status });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <PageShell
      title={session?.name ?? "Training attendance"}
      subtitle={`${sched.scheduled_date} · ${players.length} players`}
    >
      <div className="flex flex-wrap items-center gap-2 mb-4 print:hidden">
        <Link to="/calendar" className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm">
          <ArrowLeft className="w-4 h-4" /> Calendar
        </Link>
        <button onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {STATUSES.map((s) => (
          <div key={s} className="bg-card border border-border rounded-md px-2 py-2 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{STATUS_META[s].label}</p>
            <p className="text-xl font-semibold tabular-nums">{counts[s]}</p>
          </div>
        ))}
      </div>

      {!perms.canCreate && (
        <p className="text-xs text-muted-foreground mb-3">You don't have permission to edit attendance.</p>
      )}

      {players.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">No players to mark.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {players.map((p) => {
            const current = byPlayer.get(p.id);
            return (
              <li key={p.id} className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.position ? POSITION_SHORT[p.position] : "—"}
                      {p.jersey_number != null && ` · #${p.jersey_number}`}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {STATUSES.map((s) => {
                    const active = current === s;
                    return (
                      <button
                        key={s}
                        disabled={!perms.canCreate}
                        onClick={() => setStatus(p.id, s)}
                        className={`h-11 rounded-md text-xs font-medium transition-all ${
                          active
                            ? STATUS_META[s].color + " shadow"
                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {STATUS_META[s].label}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}
