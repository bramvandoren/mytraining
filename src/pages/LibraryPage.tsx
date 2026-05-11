import { useState, useEffect } from "react";
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
import { Plus, Sparkles } from "lucide-react";

export default function LibraryPage({ defaultFavoritesOnly = false }: { defaultFavoritesOnly?: boolean }) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel | "">("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(defaultFavoritesOnly || params.get("favorites") === "1");
  const [detailExercise, setDetailExercise] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

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
  const { data: customExercises = [] } = useCustomExercises();
  const { user } = useAuth();
  const { data: favoriteIds = new Set<string>() } = useFavorites();
  const toggleFav = useToggleFavorite();
  const { data: tagMap = {} } = useExerciseTagMap();

  const creatorIds = [...new Set(customExercises.filter(e => e.userId).map(e => e.userId!))];
  const { data: creatorProfiles = {} } = useProfiles(creatorIds);

  const allExercises: any[] = [...customExercises, ...exercises];

  const toggleTag = (id: string) =>
    setSelectedTagIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const filtered = allExercises.filter((ex: Exercise & any) => {
    if (search && !ex.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (ageGroup && !ex.ageGroups.includes(ageGroup)) return false;
    if (skillLevel && ex.skillLevel !== skillLevel) return false;
    if (favoritesOnly && !favoriteIds.has(ex.id)) return false;
    if (selectedTagIds.length > 0) {
      const cid = ex.customId;
      const exTags = cid ? (tagMap[cid] ?? []) : [];
      if (!selectedTagIds.some((tid) => exTags.includes(tid))) return false;
    }
    return true;
  });

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
              {defaultFavoritesOnly ? "Favorite exercises" : "Exercise library"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {defaultFavoritesOnly ? "Your starred drills" : "Browse and filter all drills"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenerator(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-primary border border-primary/30 hover:bg-primary/10 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Generate</span>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New exercise</span>
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
          <p className="text-xs text-muted-foreground font-mono tabular-nums">{filtered.length} exercises</p>
          <AnimatePresence>
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} onAdd={addExercise} isAdded={false}
                  onClick={() => setDetailExercise(exercise)}
                  creatorName={exercise.isCustom && exercise.userId ? creatorProfiles[exercise.userId]?.display_name : undefined}
                  isFavorite={favoriteIds.has(exercise.id)}
                  onToggleFavorite={user ? () => toggleFav.mutate({ exerciseId: exercise.id, isFav: favoriteIds.has(exercise.id) }) : undefined}
                />
              ))}
            </div>
          </AnimatePresence>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-12">No exercises match your filters</p>
          )}
        </div>
      </div>
    </>
  );
}
