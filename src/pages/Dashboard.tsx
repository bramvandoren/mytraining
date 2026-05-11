import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Dumbbell, BookOpen, Bookmark, CalendarDays, Globe, Building2, CalendarRange,
  Plus, Sparkles, Play, Star, Activity, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { useCustomExercises } from "@/hooks/useCustomExercises";
import { useFavorites } from "@/hooks/useFavorites";
import { useScheduled } from "@/hooks/useScheduled";
import { useTemplates } from "@/hooks/useTemplates";
import { useSessionStore } from "@/store/sessionStore";
import { exercises as builtinExercises } from "@/data/exercises";
import { format, isToday, parseISO, isAfter, startOfDay } from "date-fns";

function StatCard({ icon: Icon, label, value, to, accent }: any) {
  return (
    <Link
      to={to}
      className="group relative rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground tabular-nums">{value}</p>
        </div>
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

function NavCard({ icon: Icon, title, description, to }: any) {
  return (
    <Link
      to={to}
      className="group rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-accent/30 transition-all flex items-start gap-3"
    >
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
        <Icon className="w-4 h-4 text-foreground group-hover:text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center" />
    </Link>
  );
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { data: sessions = [] } = useTrainingSessions();
  const { data: customExercises = [] } = useCustomExercises();
  const { data: favoriteIds = new Set<string>() } = useFavorites();
  const { data: scheduled = [] } = useScheduled();
  const { data: templates = [] } = useTemplates();
  const { startMatchday, currentExercises } = useSessionStore();

  const totalExercises = customExercises.length + builtinExercises.length;
  const exercisesById = useMemo(() => {
    const m = new Map<string, any>();
    [...customExercises, ...builtinExercises].forEach((e) => m.set(e.id, e));
    return m;
  }, [customExercises]);

  const today = startOfDay(new Date());
  const upcoming = scheduled
    .filter((s) => {
      const d = parseISO(s.scheduled_date);
      return isAfter(d, today) || isToday(d);
    })
    .slice(0, 5);

  const todayScheduled = scheduled.find((s) => isToday(parseISO(s.scheduled_date)));
  const todaySession = todayScheduled
    ? sessions.find((x) => x.id === todayScheduled.session_id)
    : null;

  const recentSessions = sessions.slice(0, 4);
  const favoriteList = useMemo(
    () => Array.from(favoriteIds).map((id) => exercisesById.get(id)).filter(Boolean).slice(0, 5),
    [favoriteIds, exercisesById],
  );
  const recentExercises = customExercises.slice(0, 5);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const name = profile?.display_name || user?.email?.split("@")[0] || "Coach";

  const startToday = () => {
    if (todaySession) {
      startMatchday(todaySession);
    }
  };

  return (
    <div className="bg-background">
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        {/* Greeting */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
            {greeting}, {name}
          </h2>
        </motion.section>

        {/* Today's training */}
        {todaySession && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-5"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">Today's Training</p>
                <h3 className="text-lg font-semibold text-foreground mt-1">{todaySession.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {todaySession.exercises.length} exercises · {todaySession.total_duration} min · {todaySession.ageGroup}
                </p>
              </div>
              <button
                onClick={startToday}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Play className="w-4 h-4" />
                Start Matchday Mode
              </button>
            </div>
          </motion.section>
        )}

        {/* Quick Actions */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/library"
              className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-all flex flex-col items-start gap-2"
            >
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold">Create Training</p>
              <p className="text-xs text-muted-foreground">Build a new session</p>
            </Link>
            <Link
              to="/library?open=create"
              className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-all flex flex-col items-start gap-2"
            >
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold">Create Exercise</p>
              <p className="text-xs text-muted-foreground">Design a new drill</p>
            </Link>
            <Link
              to="/library?open=generator"
              className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-all flex flex-col items-start gap-2"
            >
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold">Smart Generator</p>
              <p className="text-xs text-muted-foreground">Auto-build a session</p>
            </Link>
            <Link
              to="/templates"
              className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-all flex flex-col items-start gap-2"
            >
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold">Open Templates</p>
              <p className="text-xs text-muted-foreground">Reusable plans</p>
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Dumbbell} label="Exercises" value={totalExercises} to="/library" accent="bg-primary/10 text-primary" />
            <StatCard icon={BookOpen} label="Trainings" value={sessions.length} to="/sessions" accent="bg-blue-500/10 text-blue-500" />
            <StatCard icon={Star} label="Favorites" value={favoriteIds.size} to="/favorites" accent="bg-amber-500/10 text-amber-500" />
            <StatCard icon={CalendarDays} label="Upcoming" value={upcoming.length} to="/calendar" accent="bg-violet-500/10 text-violet-500" />
          </div>
        </section>

        {/* Two column content */}
        <section className="grid md:grid-cols-2 gap-4">
          {/* Recent trainings */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Recent trainings</h3>
              <Link to="/sessions" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            {recentSessions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No trainings yet. Create your first session.</p>
            ) : (
              <ul className="space-y-1">
                {recentSessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      to="/sessions"
                      className="flex items-center justify-between gap-3 px-2 py-2 rounded-sm hover:bg-muted/60 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.name || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.exercises.length} ex · {s.total_duration} min · {s.ageGroup}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(parseISO(s.date), "MMM d")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Upcoming */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Upcoming sessions</h3>
              <Link to="/calendar" className="text-xs text-primary hover:underline">Calendar</Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">No scheduled trainings.</p>
            ) : (
              <ul className="space-y-1">
                {upcoming.map((s) => {
                  const session = sessions.find((x) => x.id === s.session_id);
                  return (
                    <li key={s.id}>
                      <Link
                        to="/calendar"
                        className="flex items-center justify-between gap-3 px-2 py-2 rounded-sm hover:bg-muted/60 transition-colors"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-muted flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-[9px] uppercase text-muted-foreground leading-none">
                              {format(parseISO(s.scheduled_date), "MMM")}
                            </span>
                            <span className="text-sm font-semibold leading-none mt-0.5">
                              {format(parseISO(s.scheduled_date), "d")}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{session?.name || "Scheduled"}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.repeat_weekly ? "Repeats weekly" : format(parseISO(s.scheduled_date), "EEEE")}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Favorites */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Favorite exercises</h3>
              <Link to="/favorites" className="text-xs text-primary hover:underline">View</Link>
            </div>
            {favoriteList.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">Star exercises to find them here.</p>
            ) : (
              <ul className="space-y-1">
                {favoriteList.map((ex: any) => (
                  <li key={ex.id} className="flex items-center gap-3 px-2 py-2 rounded-sm hover:bg-muted/60">
                    <span className="text-lg leading-none">{ex.icon || "⚽"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{ex.title}</p>
                      <p className="text-xs text-muted-foreground">{ex.duration} min · {ex.skillLevel}</p>
                    </div>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent exercises */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Recently created exercises</h3>
              <Link to="/library" className="text-xs text-primary hover:underline">Library</Link>
            </div>
            {recentExercises.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">You haven't created any exercises yet.</p>
            ) : (
              <ul className="space-y-1">
                {recentExercises.map((ex: any) => (
                  <li key={ex.id} className="flex items-center gap-3 px-2 py-2 rounded-sm hover:bg-muted/60">
                    <span className="text-lg leading-none">{ex.icon || "⚽"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{ex.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {ex.duration} min · {ex.players} players
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Continue editing */}
        {currentExercises.length > 0 && (
          <section className="rounded-lg border border-dashed border-border bg-muted/30 p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Continue editing</p>
                <p className="text-xs text-muted-foreground">
                  You have an unfinished session with {currentExercises.length} exercise{currentExercises.length === 1 ? "" : "s"}.
                </p>
              </div>
            </div>
            <Link
              to="/library"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-foreground text-background text-sm font-medium hover:opacity-90"
            >
              Resume <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        )}

        {/* Navigation hub */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Explore</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <NavCard icon={Dumbbell} title="Exercise Library" description="Browse and filter all drills" to="/library" />
            <NavCard icon={BookOpen} title="Sessions" description="Your saved trainings" to="/sessions" />
            <NavCard icon={Bookmark} title="Templates" description="Reusable training plans" to="/templates" />
            <NavCard icon={CalendarDays} title="Calendar" description="Schedule your trainings" to="/calendar" />
            <NavCard icon={CalendarRange} title="Season Planner" description="Plan long-term goals" to="/season" />
            <NavCard icon={Globe} title="Community" description="Discover public exercises" to="/community" />
            <NavCard icon={Building2} title="Club" description="Manage your club & members" to="/club" />
          </div>
        </section>
      </main>
    </div>
  );
}
