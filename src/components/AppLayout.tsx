import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home, Dumbbell, BookOpen, Bookmark, CalendarDays, CalendarRange, Star,
  Globe, Building2, Plus, Sparkles, LogOut, User, Menu, X, PanelRightOpen,
  PanelRightClose, MoreHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useActiveClub } from "@/hooks/useClubs";
import { useSessionStore } from "@/store/sessionStore";
import { SessionBuilder } from "@/components/SessionBuilder";
import { MatchdayMode } from "@/components/MatchdayMode";
import { CreateExerciseModal } from "@/components/CreateExerciseModal";
import { GeneratorModal } from "@/components/GeneratorModal";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

function navItemClasses(isActive: boolean) {
  return cn(
    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors w-full",
    isActive
      ? "bg-foreground text-background"
      : "text-muted-foreground hover:text-foreground hover:bg-muted",
  );
}

export default function AppLayout() {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const { active: activeClub, clubs, setActiveId } = useActiveClub();
  const { currentExercises, activeSession } = useSessionStore();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const NAV = [
    { to: "/", label: t("nav.dashboard"), icon: Home, end: true },
    { to: "/library", label: t("nav.library"), icon: Dumbbell },
    { to: "/trainings", label: t("nav.trainings"), icon: BookOpen },
    { to: "/templates", label: t("nav.templates"), icon: Bookmark },
    { to: "/calendar", label: t("nav.calendar"), icon: CalendarDays },
    { to: "/favorites", label: t("nav.favorites"), icon: Star },
    { to: "/season", label: t("nav.season"), icon: CalendarRange },
    { to: "/community", label: t("nav.community"), icon: Globe },
    { to: "/club", label: t("nav.club"), icon: Building2 },
  ];

  const MOBILE_BOTTOM = NAV.slice(0, 4);

  useEffect(() => {
    setMobileNavOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      if (detail === "create") setShowCreate(true);
      if (detail === "generator") setShowGenerator(true);
      if (detail === "builder") setBuilderOpen(true);
    };
    window.addEventListener("app:open", onOpen);
    return () => window.removeEventListener("app:open", onOpen);
  }, []);

  const name = profile?.display_name || user?.email?.split("@")[0] || "Coach";

  const Sidebar = (
    <nav className="flex flex-col h-full bg-card">
      <div className="px-4 h-14 flex items-center gap-2 border-b border-border">
        <span className="text-xl">⚽</span>
        <span className="font-semibold tracking-tight flex-1">{t("app.name")}</span>
        <LanguageSwitcher compact />
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2.5 mb-1.5">
          {t("nav.workspace")}
        </p>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end as any}
            className={({ isActive }) => navItemClasses(isActive)}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}

        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2.5 mt-5 mb-1.5">
          {t("nav.quickActions")}
        </p>
        <button
          onClick={() => setShowGenerator(true)}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium w-full text-primary hover:bg-primary/10 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          {t("nav.smartGenerator")}
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium w-full text-primary hover:bg-primary/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("nav.createExercise")}
        </button>
        <button
          onClick={() => setBuilderOpen(true)}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium w-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <PanelRightOpen className="w-4 h-4" />
          <span className="flex-1 text-left">{t("nav.trainingBuilder")}</span>
          {currentExercises.length > 0 && (
            <span className="text-[10px] font-mono tabular-nums bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
              {currentExercises.length}
            </span>
          )}
        </button>
      </div>

      <div className="border-t border-border p-3 space-y-2">
        {clubs.length > 1 && (
          <select
            value={activeClub?.id ?? ""}
            onChange={(e) => setActiveId(e.target.value)}
            className="w-full text-xs bg-muted rounded-md px-2 py-1.5 outline-none"
          >
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            title={t("common.signOut")}
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      <AnimatePresence>{activeSession && <MatchdayMode />}</AnimatePresence>
      <AnimatePresence>
        {showCreate && <CreateExerciseModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showGenerator && <GeneratorModal onClose={() => setShowGenerator(false)} />}
      </AnimatePresence>

      <div className="min-h-screen flex bg-background">
        <aside className="hidden md:flex w-60 lg:w-64 flex-shrink-0 border-r border-border sticky top-0 h-screen">
          {Sidebar}
        </aside>

        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMobileNavOpen(false)}
                className="fixed inset-0 bg-foreground/40 z-40 md:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed inset-y-0 left-0 w-72 z-50 md:hidden border-r border-border"
              >
                {Sidebar}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="md:hidden border-b border-border bg-background sticky top-0 z-30 h-14 flex items-center justify-between px-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-md text-foreground hover:bg-muted"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg">⚽</span>
              <span className="font-semibold text-sm">{t("app.name")}</span>
            </Link>
            <div className="flex items-center gap-1">
              <LanguageSwitcher compact />
              <button
                onClick={() => setBuilderOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-md text-foreground hover:bg-muted relative"
                aria-label={t("nav.trainingBuilder")}
              >
                <PanelRightOpen className="w-5 h-5" />
                {currentExercises.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-[9px] font-mono tabular-nums bg-primary text-primary-foreground rounded-full px-1 min-w-[16px] h-[16px] flex items-center justify-center">
                    {currentExercises.length}
                  </span>
                )}
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <Outlet />
          </main>

          <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border">
            <div className="grid grid-cols-5">
              {MOBILE_BOTTOM.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to} to={to} end={end as any}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{label.split(" ")[0]}</span>
                </NavLink>
              ))}
              <button
                onClick={() => setMoreOpen(true)}
                className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground"
              >
                <MoreHorizontal className="w-5 h-5" />
                <span>{t("nav.more")}</span>
              </button>
            </div>
          </nav>
        </div>

        <AnimatePresence>
          {builderOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setBuilderOpen(false)}
                className="fixed inset-0 bg-foreground/40 z-40"
              />
              <motion.aside
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed inset-y-0 right-0 w-full sm:w-[400px] z-50 bg-background border-l border-border flex flex-col"
              >
                <div className="flex items-center justify-between p-3 border-b border-border h-14 flex-shrink-0">
                  <span className="text-sm font-semibold">{t("nav.trainingBuilder")}</span>
                  <button
                    onClick={() => setBuilderOpen(false)}
                    className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted"
                    aria-label={t("common.close")}
                  >
                    <PanelRightClose className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <SessionBuilder />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {moreOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMoreOpen(false)}
                className="fixed inset-0 bg-foreground/40 z-40 md:hidden"
              />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "tween", duration: 0.2 }}
                className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border rounded-t-xl p-3 md:hidden"
              >
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-sm font-semibold">{t("nav.more")}</span>
                  <button
                    onClick={() => setMoreOpen(false)}
                    className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {NAV.slice(4).map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to} to={to}
                      className={({ isActive }) =>
                        cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-md text-xs font-medium transition-colors",
                          isActive ? "bg-foreground text-background" : "bg-muted/50 text-foreground hover:bg-muted",
                        )
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-center leading-tight">{label}</span>
                    </NavLink>
                  ))}
                  <button
                    onClick={() => { setShowGenerator(true); setMoreOpen(false); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-md text-xs font-medium bg-primary/10 text-primary"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>{t("nav.smartGenerator")}</span>
                  </button>
                  <button
                    onClick={() => { setShowCreate(true); setMoreOpen(false); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-md text-xs font-medium bg-primary/10 text-primary"
                  >
                    <Plus className="w-5 h-5" />
                    <span>{t("nav.createExercise")}</span>
                  </button>
                  <button
                    onClick={signOut}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-md text-xs font-medium bg-muted/50 text-foreground hover:bg-muted"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>{t("common.signOut")}</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
