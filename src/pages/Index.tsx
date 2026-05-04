import { useState } from "react";
import { exercises, Exercise, AgeGroup, ExerciseType, SkillLevel } from "@/data/exercises";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ExerciseFilters } from "@/components/ExerciseFilters";
import { SessionBuilder } from "@/components/SessionBuilder";
import { SavedSessions } from "@/components/SavedSessions";
import { Templates } from "@/components/Templates";
import { Calendar } from "@/components/Calendar";
import { MatchdayMode } from "@/components/MatchdayMode";
import { ExerciseDetailModal } from "@/components/ExerciseDetailModal";
import { CreateExerciseModal } from "@/components/CreateExerciseModal";
import { useSessionStore } from "@/store/sessionStore";
import { useCustomExercises } from "@/hooks/useCustomExercises";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { AnimatePresence } from "framer-motion";
import { Dumbbell, BookOpen, PanelRightOpen, PanelRightClose, Plus, LogOut, User, Bookmark, CalendarDays } from "lucide-react";

type Tab = "library" | "sessions" | "templates" | "calendar";

const Index = () => {
  const [tab, setTab] = useState<Tab>("library");
  const [search, setSearch] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [type, setType] = useState<ExerciseType | "">("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel | "">("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailExercise, setDetailExercise] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { addExercise, currentExercises, activeSession } = useSessionStore();
  const { data: customExercises = [] } = useCustomExercises();
  const { user, profile, signOut } = useAuth();
  const { data: favoriteIds = new Set<string>() } = useFavorites();
  const toggleFav = useToggleFavorite();

  const creatorIds = [...new Set(customExercises.filter(e => e.userId).map(e => e.userId!))];
  const { data: creatorProfiles = {} } = useProfiles(creatorIds);

  const allExercises: (Exercise & { isCustom?: boolean; fieldDiagram?: any; previewImageUrl?: string | null; videoUrl?: string | null; userId?: string | null })[] = [
    ...customExercises,
    ...exercises,
  ];

  const filtered = allExercises.filter((ex) => {
    if (search && !ex.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (ageGroup && !ex.ageGroups.includes(ageGroup)) return false;
    if (type && ex.type !== type) return false;
    if (skillLevel && ex.skillLevel !== skillLevel) return false;
    if (favoritesOnly && !favoriteIds.has(ex.id)) return false;
    return true;
  });

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "library", label: "Library", icon: Dumbbell },
    { key: "sessions", label: "Sessions", icon: BookOpen },
    { key: "templates", label: "Templates", icon: Bookmark },
    { key: "calendar", label: "Calendar", icon: CalendarDays },
  ];

  return (
    <>
      <AnimatePresence>{activeSession && <MatchdayMode />}</AnimatePresence>

      <AnimatePresence>
        {detailExercise && (
          <ExerciseDetailModal
            exercise={detailExercise}
            onClose={() => setDetailExercise(null)}
            onAdd={addExercise}
            isAdded={false}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreate && <CreateExerciseModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-background sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 md:px-6 h-14 gap-2">
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xl">⚽</span>
              <h1 className="font-semibold text-foreground tracking-tight text-lg hidden md:block">
                Training Architect
              </h1>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-medium transition-all whitespace-nowrap ${
                    tab === key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-medium text-primary hover:bg-primary/10 transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2 border-l border-border pl-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground hidden md:block max-w-[100px] truncate">
                  {profile?.display_name || user?.email?.split("@")[0]}
                </span>
                <button onClick={signOut} title="Sign out"
                  className="w-7 h-7 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
              {currentExercises.length > 0 && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                  <span className="font-mono tabular-nums">{currentExercises.length}</span>
                </button>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-9 h-9 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all md:hidden"
              >
                {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto p-4 md:p-6">
              {tab === "library" && (
                <>
                  <ExerciseFilters
                    search={search} onSearchChange={setSearch}
                    ageGroup={ageGroup} onAgeGroupChange={setAgeGroup}
                    type={type} onTypeChange={setType}
                    skillLevel={skillLevel} onSkillLevelChange={setSkillLevel}
                    favoritesOnly={favoritesOnly}
                    onFavoritesToggle={() => setFavoritesOnly((v) => !v)}
                  />
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-mono tabular-nums">
                      {filtered.length} exercises
                    </p>
                    <AnimatePresence>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {filtered.map((exercise) => (
                          <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            onAdd={addExercise}
                            isAdded={false}
                            onClick={() => setDetailExercise(exercise)}
                            creatorName={exercise.isCustom && exercise.userId ? creatorProfiles[exercise.userId]?.display_name : undefined}
                            isFavorite={favoriteIds.has(exercise.id)}
                            onToggleFavorite={user ? () => toggleFav.mutate({ exerciseId: exercise.id, isFav: favoriteIds.has(exercise.id) }) : undefined}
                          />
                        ))}
                      </div>
                    </AnimatePresence>
                    {filtered.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-12">
                        No exercises match your filters
                      </p>
                    )}
                  </div>
                </>
              )}
              {tab === "sessions" && <SavedSessions />}
              {tab === "templates" && <Templates />}
              {tab === "calendar" && <Calendar />}
            </div>
          </main>

          <aside
            className={`border-l border-border bg-background transition-all duration-200 overflow-hidden ${
              sidebarOpen ? "w-full md:w-[360px] fixed md:relative inset-0 md:inset-auto z-30 md:z-auto" : "w-0"
            }`}
          >
            <div className="w-full md:w-[360px] h-full flex flex-col">
              <div className="md:hidden flex items-center justify-between p-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Session Builder</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1">
                  <PanelRightClose className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SessionBuilder />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default Index;
