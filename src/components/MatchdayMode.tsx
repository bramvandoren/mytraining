import { useSessionStore } from "@/store/sessionStore";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function MatchdayMode() {
  const { activeSession, activeExerciseIndex, setActiveExerciseIndex, stopMatchday } = useSessionStore();

  if (!activeSession) return null;

  const exercise = activeSession.exercises[activeExerciseIndex];
  const total = activeSession.exercises.length;
  const canPrev = activeExerciseIndex > 0;
  const canNext = activeExerciseIndex < total - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="font-semibold text-foreground tracking-tight">
            {activeSession.name}
          </h1>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {activeExerciseIndex + 1} / {total}
          </span>
        </div>
        <button
          onClick={stopMatchday}
          className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((activeExerciseIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Exercise content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={exercise.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.2 }}
            className="max-w-2xl mx-auto p-6 md:p-10"
          >
            <div className="text-center mb-8">
              <span className="text-5xl mb-4 block">{exercise.exercise.icon}</span>
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
                {exercise.exercise.title}
              </h2>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className="text-sm font-mono text-muted-foreground tabular-nums">
                  {exercise.exercise.duration} min
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">
                  {exercise.exercise.players} players
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground capitalize">
                  {exercise.exercise.fieldSize} field
                </span>
              </div>
            </div>

            {/* Field visualization placeholder */}
            <div className="aspect-[4/3] bg-muted rounded-md mb-6 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-4 border-2 border-foreground/10 rounded-sm">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-foreground/10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-foreground/10" />
              </div>
              <span className="text-7xl opacity-30">{exercise.exercise.icon}</span>
            </div>

            <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
              {exercise.exercise.description}
            </p>

            {exercise.notes && (
              <div className="mt-6 p-4 bg-muted rounded-md">
                <p className="text-sm font-medium text-foreground mb-1">Coach Notes</p>
                <p className="text-sm text-muted-foreground">{exercise.notes}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => canPrev && setActiveExerciseIndex(activeExerciseIndex - 1)}
            disabled={!canPrev}
            className="flex items-center gap-2 px-5 py-3 rounded-sm text-sm font-medium transition-all disabled:opacity-30 hover:bg-muted min-w-[120px]"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <div className="flex gap-1.5">
            {activeSession.exercises.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveExerciseIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeExerciseIndex ? "bg-primary w-6" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => canNext && setActiveExerciseIndex(activeExerciseIndex + 1)}
            disabled={!canNext}
            className="flex items-center gap-2 px-5 py-3 rounded-sm bg-primary text-primary-foreground text-sm font-medium transition-all disabled:opacity-30 hover:opacity-90 min-w-[120px] justify-center"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
