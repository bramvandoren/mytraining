import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { exercises, Exercise, AgeGroup, SkillLevel } from "@/data/exercises";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ExerciseFilters } from "@/components/ExerciseFilters";
import { ExerciseDetailModal } from "@/components/ExerciseDetailModal";
import { CreateExerciseModal } from "@/components/CreateExerciseModal";
import { GeneratorModal } from "@/components/GeneratorModal";
import { useSessionStore } from "@/store/sessionStore";
import { useCustomExercises } from "@/hooks/useCustomExercises";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { useFavorites, useToggleFavorite } from "@/hooks/useFavorites";
import { useExerciseTagMap } from "@/hooks/useTags";
import { Plus, Sparkles, Search } from "lucide-react";
import { GridSkeleton, EmptyState, ErrorState } from "@/components/QueryState";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 24;

export default function LibraryPage({ defaultFavoritesOnly = false }: { defaultFavoritesOnly?: boolean }) {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel | "">("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(defaultFavoritesOnly || params.get("favorites") === "1");
  const [detailExercise, setDetailExercise] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const open = params.get("open");
    if (open === "create") setShowCreate(true);
    if (open === "generator") setShowGenerator(true);
    if (open) {
      const next = new URLSearchParams(params);
      next.delete("open");
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { addExercise } = useSessionStore();
  const { data: customExercises = [], isLoading, isError, error, refetch } = useCustomExercises();
  const { user } = useAuth();
  const { data: favoriteIds = new Set<string>() } = useFavorites();
  const toggleFav = useToggleFavorite();
  const { data: tagMap = {} } = useExerciseTagMap();

  const creatorIds = useMemo(
    () => [...new Set(customExercises.filter((e) => e.userId).map((e) => e.userId!))],
    [customExercises],
  );
  const { data: creatorProfiles = {} } = useProfiles(creatorIds);

  const allExercises = useMemo<any[]>(
    () => [...customExercises, ...exercises],
    [customExercises],
  );

  const toggleTag = (id: string) =>
    setSelectedTagIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const filtered = useMemo(() => {
    const lc = search.toLowerCase();
    return allExercises.filter((ex: Exercise & any) => {
      if (search && !ex.title.toLowerCase().includes(lc)) return false;
      if (ageGroup && !ex.ageGroups.includes(ageGroup)) return false;
      if (skillLevel && ex.skillLevel !== skillLevel) return false;
      if (favoritesOnly && !favoriteIds.has(ex.id)) return false;
      if (selectedTagIds.length > 0) {
        const cid = ex.customId;
        const exTags = cid ? tagMap[cid] ?? [] : [];
        if (!selectedTagIds.some((tid) => exTags.includes(tid))) return false;
      }
      return true;
    });
  }, [allExercises, search, ageGroup, skillLevel, favoritesOnly, favoriteIds, selectedTagIds, tagMap]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, ageGroup, skillLevel, favoritesOnly, selectedTagIds]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  return (
    <>
      <AnimatePresence>
        {detailExercise && (
          <ExerciseDetailModal exercise={detailExercise} onClose={() => setDetailExercise(null)} onAdd={addExercise} isAdded={false} />
        )}
      </AnimatePresence>
      <AnimatePresence>{showCreate && <CreateExerciseModal onClose={() => setShowCreate(false)} />}</AnimatePresence>
      <AnimatePresence>{showGenerator && <GeneratorModal onClose={() => setShowGenerator(false)} />}</AnimatePresence>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              {defaultFavoritesOnly ? t("library.favoritesTitle") : t("library.title")}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {defaultFavoritesOnly ? t("library.favoritesSubtitle") : t("library.subtitle")}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setShowGenerator(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-primary border border-primary/30 hover:bg-primary/10 transition-colors min-h-[40px]"
            >
              <Sparkles className="w-4 h-4" />
              {t("library.generate")}
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              {t("library.newExercise")}
            </button>
          </div>
        </div>

        <ExerciseFilters
          search={search} onSearchChange={setSearch}
          ageGroup={ageGroup} onAgeGroupChange={setAgeGroup}
          skillLevel={skillLevel} onSkillLevelChange={setSkillLevel}
          selectedTagIds={selectedTagIds} onToggleTag={toggleTag}
          favoritesOnly={favoritesOnly}
          onFavoritesToggle={() => setFavoritesOnly((v) => !v)}
        />

        <div className="mt-4 space-y-2">
          {isLoading ? (
            <GridSkeleton count={6} />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : (
            <>
              <p className="text-xs text-muted-foreground font-mono tabular-nums">
                {t("library.count", { count: filtered.length })}
              </p>
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={t("library.noMatch")}
                  description={t("library.noMatchDesc")}
                />
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {visible.map((exercise) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        onAdd={addExercise}
                        isAdded={false}
                        onClick={() => setDetailExercise(exercise)}
                        creatorName={
                          exercise.isCustom && exercise.userId
                            ? creatorProfiles[exercise.userId]?.display_name
                            : undefined
                        }
                        isFavorite={favoriteIds.has(exercise.id)}
                        onToggleFavorite={
                          user
                            ? () =>
                                toggleFav.mutate({
                                  exerciseId: exercise.id,
                                  isFav: favoriteIds.has(exercise.id),
                                })
                            : undefined
                        }
                      />
                    ))}
                  </div>
                  {visible.length < filtered.length && (
                    <div className="flex justify-center py-4">
                      <button
                        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                        className="px-4 py-2 rounded-md bg-muted text-foreground text-sm font-medium hover:bg-muted/70 min-h-[40px]"
                      >
                        {t("common.showMore")} ({filtered.length - visible.length})
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile sticky FAB row */}
      <div className="sm:hidden fixed bottom-20 right-4 z-30 flex flex-col gap-2">
        <button
          onClick={() => setShowGenerator(true)}
          className="w-12 h-12 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-primary"
          aria-label="Smart generator"
        >
          <Sparkles className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          aria-label="New exercise"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </>
  );
}
