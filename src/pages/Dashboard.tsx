import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Dumbbell, BookOpen, Bookmark, CalendarDays, Globe, Building2, CalendarRange,
  Plus, Sparkles, Play, Star, Activity, ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { useCustomExercises } from "@/hooks/useCustomExercises";
import { useFavorites } from "@/hooks/useFavorites";
import { useScheduled } from "@/hooks/useScheduled";
import { useSessionStore } from "@/store/sessionStore";
import { exercises as builtinExercises } from "@/data/exercises";
import { format, isToday, parseISO, isAfter, startOfDay } from "date-fns";

function StatCard({ icon: Icon, label, value, to, accent }: any) {
  return (
    <Link to={to} className="group relative rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all">
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
    <Link to={to} className="group rounded-lg border border-border bg-card p-4 hover:border-primary/40 hover:bg-accent/30 transition-all flex items-start gap-3">
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
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const { data: sessions = [] } = useTrainingSessions();
  const { data: customExercises = [] } = useCustomExercises();
  const { data: favoriteIds = new Set<string>() } = useFavorites();
  const { data: scheduled = [] } = useScheduled();
  const { startMatchday, currentExercises } = useSessionStore();

  // Personal scoping
  const myExercises = useMemo(
    () => customExercises.filter((e: any) => e.userId && user && e.userId === user.id),
    [customExercises, user],
  );
  const mySessions = useMemo(
    () => sessions.filter((s) => user && s.user_id === user.id),
    [sessions, user],
  );

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
  const todaySession = todayScheduled ? sessions.find((x) => x.id === todayScheduled.session_id) : null;

  const recentSessions = mySessions.slice(0, 4);
  const favoriteList = useMemo(
    () => Array.from(favoriteIds).map((id) => exercisesById.get(id)).filter(Boolean).slice(0, 5),
    [favoriteIds, exercisesById],
  );
  const recentMyExercises = myExercises.slice(0, 5);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.greetingMorning");
    if (h < 18) return t("dashboard.greetingAfternoon");
    return t("dashboard.greetingEvening");
  })();
  const name = profile?.display_name || user?.email?.split("@")[0] || "Coach";
  const locale = i18n.resolvedLanguage?.startsWith("en") ? "en-US" : "nl-NL";

  return (
    <div className="bg-background">
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mt-1">
            {greeting}, {name}
          </h2>
        </motion.section>

        {todaySession && (
          <motion.section
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}
            className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-5"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">{t("dashboard.todayTraining")}</p>
                <h3 className="text-lg font-semibold text-foreground mt-1">{todaySession.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {todaySession.exercises.length} {t("common.drills")} · {todaySession.total_duration} {t("common.min")} · {todaySession.ageGroup}
                </p>
              </div>
              <button
                onClick={() => startMatchday(todaySession)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Play className="w-4 h-4" />
                {t("dashboard.startMatchday")}
              </button>
            </div>
          </motion.section>
        )}

        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("dashboard.quickActions")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to="/library" className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-all flex flex-col items-start gap-2">
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Plus className="w-4 h-4" /></div>
              <p className="text-sm font-semibold">{t("dashboard.createTraining")}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.createTrainingDesc")}</p>
            </Link>
            <Link to="/library?open=create" className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-all flex flex-col items-start gap-2">
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Dumbbell className="w-4 h-4" /></div>
              <p className="text-sm font-semibold">{t("nav.createExercise")}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.createExerciseDesc")}</p>
            </Link>
            <Link to="/library?open=generator" className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-all flex flex-col items-start gap-2">
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
              <p className="text-sm font-semibold">{t("nav.smartGenerator")}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.smartGenDesc")}</p>
            </Link>
            <Link to="/templates" className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-all flex flex-col items-start gap-2">
              <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Bookmark className="w-4 h-4" /></div>
              <p className="text-sm font-semibold">{t("dashboard.openTemplates")}</p>
              <p className="text-xs text-muted-foreground">{t("dashboard.openTemplatesDesc")}</p>
            </Link>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("dashboard.overview")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Dumbbell} label={t("dashboard.myExercises")} value={myExercises.length} to="/library" accent="bg-primary/10 text-primary" />
            <StatCard icon={BookOpen} label={t("dashboard.myTrainings")} value={mySessions.length} to="/trainings" accent="bg-blue-500/10 text-blue-500" />
            <StatCard icon={Star} label={t("dashboard.myFavorites")} value={favoriteIds.size} to="/favorites" accent="bg-amber-500/10 text-amber-500" />
            <StatCard icon={CalendarDays} label={t("dashboard.upcoming")} value={upcoming.length} to="/calendar" accent="bg-violet-500/10 text-violet-500" />
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{t("dashboard.recentTrainings")}</h3>
              <Link to="/trainings" className="text-xs text-primary hover:underline">{t("common.viewAll")}</Link>
            </div>
            {recentSessions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">{t("dashboard.noTrainings")}</p>
            ) : (
              <ul className="space-y-1">
                {recentSessions.map((s) => (
                  <li key={s.id}>
                    <Link to="/trainings" className="flex items-center justify-between gap-3 px-2 py-2 rounded-sm hover:bg-muted/60 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.exercises.length} ex · {s.total_duration} {t("common.min")} · {s.ageGroup}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{format(parseISO(s.date), "MMM d")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{t("dashboard.upcomingSessions")}</h3>
              <Link to="/calendar" className="text-xs text-primary hover:underline">{t("nav.calendar")}</Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">{t("dashboard.noScheduled")}</p>
            ) : (
              <ul className="space-y-1">
                {upcoming.map((s) => {
                  const session = sessions.find((x) => x.id === s.session_id);
                  return (
                    <li key={s.id}>
                      <Link to="/calendar" className="flex items-center justify-between gap-3 px-2 py-2 rounded-sm hover:bg-muted/60 transition-colors">
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-md bg-muted flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-[9px] uppercase text-muted-foreground leading-none">{format(parseISO(s.scheduled_date), "MMM")}</span>
                            <span className="text-sm font-semibold leading-none mt-0.5">{format(parseISO(s.scheduled_date), "d")}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{session?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{format(parseISO(s.scheduled_date), "EEEE")}</p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{t("dashboard.favoriteExercises")}</h3>
              <Link to="/favorites" className="text-xs text-primary hover:underline">{t("common.viewAll")}</Link>
            </div>
            {favoriteList.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">{t("dashboard.noFavorites")}</p>
            ) : (
              <ul className="space-y-1">
                {favoriteList.map((ex: any) => (
                  <li key={ex.id} className="flex items-center gap-3 px-2 py-2 rounded-sm hover:bg-muted/60">
                    <span className="text-lg leading-none">{ex.icon || "⚽"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{ex.title}</p>
                      <p className="text-xs text-muted-foreground">{ex.duration} {t("common.min")} · {ex.skillLevel}</p>
                    </div>
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">{t("dashboard.recentExercises")}</h3>
              <Link to="/library" className="text-xs text-primary hover:underline">{t("nav.library")}</Link>
            </div>
            {recentMyExercises.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">{t("dashboard.noRecentExercises")}</p>
            ) : (
              <ul className="space-y-1">
                {recentMyExercises.map((ex: any) => (
                  <li key={ex.id} className="flex items-center gap-3 px-2 py-2 rounded-sm hover:bg-muted/60">
                    <span className="text-lg leading-none">{ex.icon || "⚽"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{ex.title}</p>
                      <p className="text-xs text-muted-foreground">{ex.duration} {t("common.min")} · {ex.players} {t("common.players")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {currentExercises.length > 0 && (
          <section className="rounded-lg border border-dashed border-border bg-muted/30 p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Activity className="w-4 h-4" /></div>
              <div>
                <p className="text-sm font-semibold">{t("dashboard.continueEditing")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.unfinishedSession", { count: currentExercises.length })}
                </p>
              </div>
            </div>
            <Link to="/library" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-foreground text-background text-sm font-medium hover:opacity-90">
              {t("dashboard.resume")} <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        )}

        <section>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("dashboard.explore")}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <NavCard icon={Dumbbell} title={t("nav.library")} description={t("library.subtitle")} to="/library" />
            <NavCard icon={BookOpen} title={t("nav.trainings")} description={t("trainings.subtitle")} to="/trainings" />
            <NavCard icon={Bookmark} title={t("nav.templates")} description={t("dashboard.openTemplatesDesc")} to="/templates" />
            <NavCard icon={CalendarDays} title={t("nav.calendar")} description="" to="/calendar" />
            <NavCard icon={CalendarRange} title={t("nav.season")} description="" to="/season" />
            <NavCard icon={Globe} title={t("nav.community")} description="" to="/community" />
            <NavCard icon={Building2} title={t("nav.club")} description="" to="/club" />
          </div>
        </section>
      </main>
    </div>
  );
}
