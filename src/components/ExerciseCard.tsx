import { Exercise } from "@/data/exercises";
import { Plus, Check } from "lucide-react";
import { motion } from "framer-motion";
import { FieldPreview } from "./FieldPreview";
import { FieldDiagram } from "@/hooks/useCustomExercises";

interface ExerciseCardProps {
  exercise: Exercise & { isCustom?: boolean; fieldDiagram?: FieldDiagram | null; previewImageUrl?: string | null; userId?: string | null };
  onAdd: (exercise: Exercise) => void;
  isAdded: boolean;
  onClick?: () => void;
  creatorName?: string;
}

const typeColors: Record<string, string> = {
  "warm-up": "bg-amber-100 text-amber-700",
  technique: "bg-blue-100 text-blue-700",
  passing: "bg-emerald-100 text-emerald-700",
  finishing: "bg-red-100 text-red-700",
  "game-form": "bg-purple-100 text-purple-700",
  fitness: "bg-orange-100 text-orange-700",
  "cool-down": "bg-sky-100 text-sky-700",
};

export function ExerciseCard({ exercise, onAdd, isAdded, onClick, creatorName }: ExerciseCardProps) {
  const hasVisual = exercise.previewImageUrl || exercise.fieldDiagram;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.2 }}
      className="group relative rounded-md bg-card shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-150 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Preview thumbnail */}
      {hasVisual && (
        <div className="aspect-[16/9] bg-muted overflow-hidden">
          {exercise.previewImageUrl ? (
            <img src={exercise.previewImageUrl} alt={exercise.title} className="w-full h-full object-cover" />
          ) : exercise.fieldDiagram ? (
            <FieldPreview diagram={exercise.fieldDiagram} className="w-full h-full" />
          ) : null}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{exercise.icon}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground tracking-tight truncate">
                {exercise.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${typeColors[exercise.type] || "bg-muted text-muted-foreground"}`}>
                  {exercise.type}
                </span>
                <span className="text-xs font-mono text-muted-foreground tabular-nums">
                  {exercise.duration} min
                </span>
                <span className="text-xs text-muted-foreground">
                  · {exercise.players} players
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(exercise); }}
            disabled={isAdded}
            className={`flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center transition-all duration-150 ${
              isAdded
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">
          {exercise.description}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {exercise.ageGroups.slice(0, 3).map((ag) => (
            <span key={ag} className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">
              {ag}
            </span>
          ))}
          {exercise.ageGroups.length > 3 && (
            <span className="text-[11px] font-mono text-muted-foreground">
              +{exercise.ageGroups.length - 3}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm capitalize">
            {exercise.skillLevel}
          </span>
          {exercise.isCustom && (
            <span className="text-[11px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm font-medium">
              Custom
            </span>
          )}
          {creatorName && (
            <span className="text-[11px] text-muted-foreground ml-auto">
              by {creatorName}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
