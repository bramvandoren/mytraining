import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Archive, ArchiveRestore, Printer, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useActiveClub, useClubPermissions } from "@/hooks/useClubs";
import { usePlayer, useArchivePlayer, POSITION_LABEL } from "@/hooks/usePlayers";
import { useTeams } from "@/hooks/useTeams";
import { usePlayerAttendance, STATUS_META } from "@/hooks/useAttendance";
import { usePlayerEvaluations, useDeleteEvaluation, RATING_FIELDS } from "@/hooks/usePlayerEvaluations";
import { PlayerForm } from "@/components/players/PlayerForm";
import { TransferDialog } from "@/components/players/TransferDialog";
import { EvaluationForm } from "@/components/players/EvaluationForm";

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { active } = useActiveClub();
  const perms = useClubPermissions(active?.id ?? null);
  const { data: player, isLoading } = usePlayer(id ?? null);
  const { data: teams = [] } = useTeams(active?.id ?? null);
  const { data: attendance = [] } = usePlayerAttendance(id ?? null);
  const { data: evaluations = [] } = usePlayerEvaluations(id ?? null);
  const deleteEvaluation = useDeleteEvaluation();
  const archive = useArchivePlayer();
  const [editing, setEditing] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const team = useMemo(() => teams.find((t) => t.id === player?.current_team_id), [teams, player]);

  const stats = useMemo(() => {
    if (attendance.length === 0) return { total: 0, present: 0, rate: 0 };
    const total = attendance.length;
    const present = attendance.filter((a: any) => a.status === "present" || a.status === "late").length;
    return { total, present, rate: Math.round((present / total) * 100) };
  }, [attendance]);

  if (isLoading) return <PageShell title="Player"><p className="text-sm text-muted-foreground">Loading…</p></PageShell>;
  if (!player) return <PageShell title="Player"><p className="text-sm text-muted-foreground">Player not found.</p></PageShell>;

  return (
    <PageShell title={`${player.first_name} ${player.last_name}`} subtitle={team?.name ?? "No team"}>
      <div className="flex flex-wrap items-center gap-2 mb-4 print:hidden">
        <Link to="/club/players" className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm">
          <ArrowLeft className="w-4 h-4" /> All players
        </Link>
        {perms.canCreate && (
          <>
            <button onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm">
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button onClick={() => setTransferring(true)}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm">
              <ArrowLeftRight className="w-4 h-4" /> Transfer
            </button>
          </>
        )}
        <button onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm">
          <Printer className="w-4 h-4" /> Print
        </button>
        {perms.canEdit && (
          <button
            onClick={async () => {
              const next = !player.archived_at;
              if (!confirm(next ? "Archive this player?" : "Restore this player?")) return;
              try {
                await archive.mutateAsync({ id: player.id, archive: next });
                toast.success(next ? "Archived" : "Restored");
              } catch (e: any) { toast.error(e.message); }
            }}
            className="ml-auto inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-border hover:bg-muted text-sm">
            {player.archived_at ? <><ArchiveRestore className="w-4 h-4" /> Restore</> : <><Archive className="w-4 h-4" /> Archive</>}
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <section className="md:col-span-2 bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-3">Profile</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Info label="Birth date" value={player.birth_date} />
            <Info label="Nationality" value={player.nationality} />
            <Info label="Position" value={player.position ? POSITION_LABEL[player.position] : null} />
            <Info label="Preferred foot" value={player.preferred_foot ? player.preferred_foot[0].toUpperCase() + player.preferred_foot.slice(1) : null} />
            <Info label="Jersey #" value={player.jersey_number?.toString() ?? null} />
            <Info label="Team" value={team?.name ?? null} />
          </dl>
          {player.notes && (
            <>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-4 mb-1">Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{player.notes}</p>
            </>
          )}
          {(player.emergency_contact || player.parent_contact || player.medical_notes) && (
            <div className="mt-4 rounded-md border border-dashed border-border p-3 bg-muted/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Restricted info</p>
              {player.emergency_contact && <Info label="Emergency contact" value={player.emergency_contact} />}
              {player.parent_contact && <Info label="Parent contact" value={player.parent_contact} />}
              {player.medical_notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Medical notes</p>
                  <p className="text-sm whitespace-pre-wrap">{player.medical_notes}</p>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-3">Attendance</h2>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-semibold tabular-nums">{stats.rate}%</span>
            <span className="text-xs text-muted-foreground">{stats.present} of {stats.total}</span>
          </div>
          {attendance.length === 0 ? (
            <p className="text-xs text-muted-foreground">No attendance records yet.</p>
          ) : (
            <ul className="space-y-1">
              {attendance.slice(0, 10).map((a: any) => (
                <li key={a.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${STATUS_META[a.status as keyof typeof STATUS_META].color}`} />
                  <span className="text-muted-foreground tabular-nums">{a.scheduled_trainings?.scheduled_date}</span>
                  <span className="ml-auto capitalize">{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="md:col-span-3 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Evaluations</h2>
            {perms.canCreate && (
              <button
                onClick={() => setEvaluating(true)}
                className="px-3 h-8 rounded-md border border-border hover:bg-muted text-xs"
              >
                Add evaluation
              </button>
            )}
          </div>
          {evaluations.length === 0 ? (
            <p className="text-xs text-muted-foreground">No evaluations yet.</p>
          ) : (
            <div className="space-y-3">
              {evaluations.map((ev) => (
                <div key={ev.id} className="border border-border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">{ev.evaluation_date}</span>
                    {perms.canEdit && (
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this evaluation?")) return;
                          try {
                            await deleteEvaluation.mutateAsync({ id: ev.id, playerId: player.id });
                            toast.success("Deleted");
                          } catch (e: any) { toast.error(e.message); }
                        }}
                        className="text-xs text-muted-foreground hover:text-rose-500"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mb-2">
                    {RATING_FIELDS.map(({ key, label }) => {
                      const value = (ev as any)[key] as number | null;
                      if (value == null) return null;
                      return (
                        <span key={key} className="text-xs">
                          <span className="text-muted-foreground">{label}: </span>
                          <span className="font-medium">{value}/5</span>
                        </span>
                      );
                    })}
                  </div>
                  {ev.strengths && <p className="text-sm"><span className="text-muted-foreground">Strengths: </span>{ev.strengths}</p>}
                  {ev.areas_to_improve && <p className="text-sm"><span className="text-muted-foreground">Areas to improve: </span>{ev.areas_to_improve}</p>}
                  {ev.coach_notes && <p className="text-sm"><span className="text-muted-foreground">Notes: </span>{ev.coach_notes}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {editing && <PlayerForm clubId={player.club_id} player={player} onClose={() => setEditing(false)} />}
      {transferring && <TransferDialog clubId={player.club_id} playerId={player.id} currentTeamId={player.current_team_id} onClose={() => setTransferring(false)} />}
      {evaluating && <EvaluationForm clubId={player.club_id} playerId={player.id} onClose={() => setEvaluating(false)} />}
    </PageShell>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value ?? <span className="text-muted-foreground">—</span>}</dd>
    </>
  );
}
