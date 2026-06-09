import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building2, Users, Dumbbell, BookOpen, ClipboardList, Calendar,
  Plus, UserPlus, Sparkles, ArrowRight, Activity, UserSquare2, AlertTriangle,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { useActiveClub, useClubPermissions } from "@/hooks/useClubs";
import { useClubStats } from "@/hooks/useClubStats";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useProfiles } from "@/hooks/useProfiles";
import { usePlayers } from "@/hooks/usePlayers";
import { useScheduled } from "@/hooks/useScheduled";
import { useState } from "react";
import { InviteDialog } from "@/components/club/InviteDialog";
import { TeamForm } from "@/components/club/TeamForm";
import { differenceInDays, parseISO } from "date-fns";

function StatTile({ icon: Icon, label, value, to }: { icon: any; label: string; value: number; to?: string }) {
  const inner = (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors group">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        {to && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function ActionButton({ icon: Icon, label, onClick, to }: { icon: any; label: string; onClick?: () => void; to?: string }) {
  const cls = "flex items-center gap-2 px-3 h-10 rounded-md bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors";
  const content = <><Icon className="w-4 h-4" /> {label}</>;
  return to ? <Link to={to} className={cls}>{content}</Link> : <button onClick={onClick} className={cls}>{content}</button>;
}

const ACTION_LABELS: Record<string, string> = {
  training_created: "created a training",
  template_created: "created a template",
  exercise_created: "added an exercise",
  team_created: "created a team",
  player_created: "added a player",
  player_archived: "archived a player",
  coach_joined: "joined the club",
  attendance_recorded: "recorded attendance",
};

export default function ClubDashboard() {
  const { t } = useTranslation();
  const { active, clubs, setActiveId } = useActiveClub();
  const perms = useClubPermissions(active?.id ?? null);
  const { data: stats } = useClubStats(active?.id ?? null);
  const { data: activity = [] } = useActivityFeed(active?.id ?? null, 8);
  const { data: profiles = {} } = useProfiles(activity.map((a) => a.user_id ?? ""));
  const { data: players = [] } = usePlayers(active?.id ?? null);
  const { data: scheduled = [] } = useScheduled();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);

  if (!active) {
    return <PageShell title={t("nav.club")}><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;
  }

  return (
    <PageShell title={active.name} subtitle={active.is_personal ? "Personal workspace" : "Club dashboard"}>
      {clubs.length > 1 && (
        <div className="mb-4">
          <select
            value={active.id} onChange={(e) => setActiveId(e.target.value)}
            className="text-sm bg-muted rounded-md px-3 py-2 outline-none"
            aria-label="Active club"
          >
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatTile icon={Users} label="Coaches" value={stats?.coaches ?? 0} to="/club/coaches" />
        <StatTile icon={Building2} label="Teams" value={stats?.teams ?? 0} to="/club/teams" />
        <StatTile icon={UserSquare2} label="Players" value={players.length} to="/club/players" />
        <StatTile icon={Dumbbell} label="Exercises" value={stats?.exercises ?? 0} to="/club/library" />
        <StatTile icon={BookOpen} label="Trainings" value={stats?.trainings ?? 0} to="/club/library" />
      </div>

      {/* Attendance alerts */}
      {(() => {
        const today = new Date();
        const upcomingScheduled = scheduled.filter((s) => {
          const d = parseISO(s.scheduled_date);
          const diff = differenceInDays(d, today);
          return diff >= -1 && diff <= 7;
        }).slice(0, 5);
        if (upcomingScheduled.length === 0) return null;
        return (
          <div className="mb-6 bg-amber-500/5 border border-amber-500/30 rounded-lg p-4">
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" /> Attendance to record
            </h2>
            <ul className="space-y-1.5">
              {upcomingScheduled.map((s) => (
                <li key={s.id}>
                  <Link to={`/calendar/${s.id}/attendance`}
                    className="flex items-center justify-between px-3 py-2 rounded-md bg-card border border-border hover:border-primary/40 transition-colors">
                    <span className="text-sm font-medium">{s.scheduled_date}</span>
                    <span className="text-xs text-primary">Mark attendance →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {/* Quick actions */}
      {perms.canCreate && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-2">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Plus} label="Create training" onClick={() => window.dispatchEvent(new CustomEvent("app:open", { detail: "builder" }))} />
            <ActionButton icon={Sparkles} label="Create exercise" onClick={() => window.dispatchEvent(new CustomEvent("app:open", { detail: "create" }))} />
            {perms.canInvite && <ActionButton icon={UserPlus} label="Invite coach" onClick={() => setInviteOpen(true)} />}
            {perms.canEdit && <ActionButton icon={ClipboardList} label="Create team" onClick={() => setTeamOpen(true)} />}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming trainings */}
        <section>
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Upcoming trainings</h2>
          {stats?.upcoming?.length ? (
            <div className="space-y-1.5">
              {stats.upcoming.map((s) => (
                <div key={s.id} className="bg-card border border-border rounded-md px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s.age_group}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{s.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No upcoming trainings.</p>
          )}
        </section>

        {/* Recent activity */}
        <section>
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2"><Activity className="w-4 h-4" /> Recent activity</h2>
          {activity.length ? (
            <ul className="space-y-1.5">
              {activity.slice(0, 6).map((a) => {
                const p = a.user_id ? profiles[a.user_id] : null;
                return (
                  <li key={a.id} className="bg-card border border-border rounded-md px-3 py-2 text-xs">
                    <span className="font-medium">{p?.display_name ?? "Someone"}</span>{" "}
                    <span className="text-muted-foreground">{ACTION_LABELS[a.action] ?? a.action}</span>
                    {a.metadata?.name && <span className="text-foreground"> — {a.metadata.name}</span>}
                    <span className="text-muted-foreground ml-1">· {new Date(a.created_at).toLocaleDateString()}</span>
                  </li>
                );
              })}
              <li><Link to="/club/activity" className="text-xs text-primary hover:underline">See all →</Link></li>
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No activity yet.</p>
          )}
        </section>
      </div>

      {inviteOpen && <InviteDialog clubId={active.id} onClose={() => setInviteOpen(false)} />}
      {teamOpen && <TeamForm clubId={active.id} onClose={() => setTeamOpen(false)} />}
    </PageShell>
  );
}
