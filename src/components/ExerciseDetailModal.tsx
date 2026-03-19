import { Exercise } from "@/data/exercises";
import { X, Clock, Users, Maximize, Plus, Check, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FieldPreview } from "./FieldPreview";
import { FieldDiagram } from "@/hooks/useCustomExercises";

interface ExerciseDetailModalProps {
  exercise: (Exercise & { isCustom?: boolean; fieldDiagram?: FieldDiagram | null; previewImageUrl?: string | null; videoUrl?: string | null }) | null;
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
  isAdded: boolean;
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

export function ExerciseDetailModal({ exercise, onClose, onAdd, isAdded }: ExerciseDetailModalProps) {
  if (!exercise) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.25 }}
          className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{exercise.icon}</span>
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight">
                  {exercise.title}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${typeColors[exercise.type] || "bg-muted text-muted-foreground"}`}>
                    {exercise.type}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">{exercise.skillLevel}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-sm flex items-center justify-center hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Field Diagram */}
          <div className="aspect-[4/3] bg-muted relative overflow-hidden">
            {exercise.previewImageUrl ? (
              <img src={exercise.previewImageUrl} alt={exercise.title} className="w-full h-full object-cover" />
            ) : exercise.fieldDiagram ? (
              <FieldPreview diagram={exercise.fieldDiagram} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="absolute inset-4 border-2 border-foreground/10 rounded-sm">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-foreground/10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-foreground/10" />
                </div>
                <span className="text-7xl opacity-20">{exercise.icon}</span>
              </div>
            )}
          </div>

          {/* Video */}
          {exercise.videoUrl && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Video Demonstration</span>
              </div>
              <video
                src={exercise.videoUrl}
                controls
                className="w-full rounded-md bg-black"
                preload="metadata"
              />
            </div>
          )}

          {/* Details */}
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-mono tabular-nums">{exercise.duration} min</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{exercise.players} players</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Maximize className="w-4 h-4" />
                <span className="capitalize">{exercise.fieldSize} field</span>
              </div>
            </div>

            <p className="text-base leading-relaxed text-muted-foreground">
              {exercise.description}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {exercise.ageGroups.map((ag) => (
                <span key={ag} className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded-sm">
                  {ag}
                </span>
              ))}
            </div>

            <button
              onClick={() => onAdd(exercise)}
              disabled={isAdded}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm text-sm font-medium transition-all ${
                isAdded
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              {isAdded ? <><Check className="w-4 h-4" /> Added to Session</> : <><Plus className="w-4 h-4" /> Add to Session</>}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
