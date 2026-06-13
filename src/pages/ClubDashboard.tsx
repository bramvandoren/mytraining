import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building2, Users, BookOpen, ClipboardList, Calendar,
  Plus, UserPlus, Sparkles, ArrowRight, Activity, UserSquare2, AlertTriangle,
  Trophy, Megaphone, Target,
} from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { useActiveClub, useClubPermissions } from "@/hooks/useClubs";
import { useClubStats } from "@/hooks/useClubStats";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useProfiles } from "@/hooks/useProfiles";
import { usePlayers } from "@/hooks/usePlayers";
import { useScheduled } from "@/hooks/useScheduled";
import { useMatches } from "@/hooks/useMatches";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useState } from "react";
import { InviteDialog } from "@/components/club/InviteDialog";
import { TeamForm } from "@/components/club/TeamForm";
import { AnnouncementForm } from "@/components/club/AnnouncementForm";
import { differenceInDays, parseISO, format, isAfter, startOfDay } from "date-fns";

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
  const { data: matches = [] } = useMatches(active?.id ?? null);
  const { data: announcements = [] } = useAnnouncements(active?.id ?? null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);

  if (!active) {
    return <PageShell title={t("nav.club")}><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;
  }

  const today = startOfDay(new Date());

  // Upcoming matches (next 5)
  const upcomingMatches = matches
    .filter((m) => m.status === "scheduled" && isAfter(parseISO(m.match_date), today))
    .sort((a, b) => a.match_date.localeCompare(b.match_date))
    .slice(0, 5);

  // Recent match results
  const recentResults = matches
    .filter((m) => m.status === "completed")
    .sort((a, b) => b.match_date.localeCompare(a.match_date))
    .slice(0, 3);

  // Attendance to record (sessions in the last 7 days with no attendance yet)
  const attendanceAlerts = scheduled.filter((s) => {
    const d = parseISO(s.scheduled_date);
    const diff = differenceInDays(today, d);
    return diff >= 0 && diff <= 7;
  }).slice(0, 3);

  // Recent announcements (top 3)
  const recentAnnouncements = announcements.slice(0, 3);

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
        <StatTile icon={Trophy} label="Matches" value={matches.length} to="/club/matches" />
        <StatTile icon={BookOpen} label="Trainings" value={stats?.trainings ?? 0} to="/club/library" />
      </div>

      {/* Attendance alerts */}
      {attendanceAlerts.length > 0 && (
        <div className="mb-6 bg-amber-500/5 border border-amber-500/30 rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" /> Attendance to record
          </h2>
          <ul className="space-y-1.5">
            {attendanceAlerts.map((s) => (
              <li key={s.id}>
                <Link to={`/calendar/${s.id}/attendance`}
                  className="flex items-center justify-between px-3 py-2 rounded-md bg-card border border-border hover:border-amber-400/60 transition-colors">
                  <span className="text-sm font-medium">{format(parseISO(s.scheduled_date), "EEE d MMM")}</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400">Mark attendance →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick actions */}
      {perms.canCreate && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-2">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={Plus} label="Create training" onClick={() => window.dispatchEvent(new CustomEvent("app:open", { detail: "builder" }))} />
            <ActionButton icon={Sparkles} label="Create exercise" onClick={() => window.dispatchEvent(new CustomEvent("app:open", { detail: "create" }))} />
            {perms.canInvite && <ActionButton icon={UserPlus} label="Invite coach" onClick={() => setInviteOpen(true)} />}
            {perms.canEdit && <ActionButton icon={ClipboardList} label="Create team" onClick={() => setTeamOpen(true)} />}
            <ActionButton icon={Trophy} label="Schedule match" to="/club/matches" />
            <ActionButton icon={Megaphone} label="Post announcement" onClick={() => setAnnouncementOpen(true)} />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Upcoming matches */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Upcoming Matches</h2>
            <Link to="/club/matches" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-1.5">
              {upcomingMatches.map((m) => (
                <Link key={m.id} to={`/club/matches/${m.id}`}
                  className="flex items-center justify-between bg-card border border-border rounded-md px-3 py-2 hover:border-primary/40 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">vs {m.opponent}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {m.venue === "home" ? "Home" : "Away"} · {m.competition ?? m.match_type}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums ml-2 flex-shrink-0">
                    {format(parseISO(m.match_date), "d MMM")}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No upcoming matches scheduled.</p>
          )}
        </section>

        {/* Upcoming trainings */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Upcoming Trainings</h2>
            <Link to="/calendar" className="text-xs text-primary hover:underline">Calendar</Link>
          </div>
          {stats?.upcoming?.length ? (
            <div className="space-y-1.5">
              {stats.upcoming.map((s) => (
                <div key={s.id} className="bg-card border border-border rounded-md px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{s.age_group}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{format(parseISO(s.date), "d MMM")}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No upcoming trainings.</p>
          )}
        </section>

        {/* Recent announcements */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Megaphone className="w-4 h-4 text-primary" /> Announcements</h2>
            <Link to="/club/announcements" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentAnnouncements.length > 0 ? (
            <div className="space-y-1.5">
              {recentAnnouncements.map((a) => (
                <Link key={a.id} to="/club/announcements"
                  className="block bg-card border border-border rounded-md px-3 py-2 hover:border-primary/40 transition-colors">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{a.body}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No announcements yet.</p>
          )}
        </section>

        {/* Recent activity */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Recent Activity</h2>
            <Link to="/club/activity" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {activity.length ? (
            <ul className="space-y-1.5">
              {activity.slice(0, 5).map((a) => {
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
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No activity yet.</p>
          )}
        </section>
      </div>

      {/* Recent results */}
      {recentResults.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Recent Results</h2>
            <Link to="/club/matches" className="text-xs text-primary hover:underline">All matches</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentResults.map((m) => (
              <Link key={m.id} to={`/club/matches/${m.id}`}
                className="bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/40 transition-colors min-w-[160px]">
                <p className="text-xs text-muted-foreground">vs {m.opponent}</p>
                <p className="text-sm font-medium mt-0.5">{format(parseISO(m.match_date), "d MMM yyyy")}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {inviteOpen && <InviteDialog clubId={active.id} onClose={() => setInviteOpen(false)} />}
      {teamOpen && <TeamForm clubId={active.id} onClose={() => setTeamOpen(false)} />}
      {announcementOpen && (
        <AnnouncementForm clubId={active.id} onClose={() => setAnnouncementOpen(false)} />
      )}
    </PageShell>
  );
}
