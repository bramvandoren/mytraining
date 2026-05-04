import { useSessionStore } from "@/store/sessionStore";
import { X, ChevronLeft, ChevronRight, Play, Pause, RotateCcw, SkipForward, Maximize2 } from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { FieldPreview } from "./FieldPreview";

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export function MatchdayMode() {
  const { activeSession, activeExerciseIndex, setActiveExerciseIndex, stopMatchday } = useSessionStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const exercise = activeSession?.exercises[activeExerciseIndex];
  const total = activeSession?.exercises.length ?? 0;
  const initialSeconds = (exercise?.exercise.duration ?? 0) * 60;

  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset timer when exercise changes
  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setRunning(false);
    setFlashing(false);
  }, [activeExerciseIndex, initialSeconds]);

  const goNext = useCallback(() => {
    if (!activeSession) return;
    if (activeExerciseIndex < activeSession.exercises.length - 1) {
      setActiveExerciseIndex(activeExerciseIndex + 1);
    }
  }, [activeSession, activeExerciseIndex, setActiveExerciseIndex]);

  const goPrev = useCallback(() => {
    if (activeExerciseIndex > 0) setActiveExerciseIndex(activeExerciseIndex - 1);
  }, [activeExerciseIndex, setActiveExerciseIndex]);

  // Timer tick
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setRunning(false);
          setFlashing(true);
          // Auto-advance after a brief flash
          setTimeout(() => {
            setFlashing(false);
            goNext();
          }, 2500);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === " ") { e.preventDefault(); setRunning((r) => !r); }
      else if (e.key === "Escape") stopMatchday();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, stopMatchday]);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -80) goNext();
    else if (info.offset.x > 80) goPrev();
  };

  if (!activeSession || !exercise) return null;

  const canPrev = activeExerciseIndex > 0;
  const canNext = activeExerciseIndex < total - 1;
  const ex = exercise.exercise as any;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Time-up flash overlay */}
      <AnimatePresence>
        {flashing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 1, 0, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, times: [0, 0.1, 0.3, 0.5, 0.7, 1] }}
            className="absolute inset-0 z-50 bg-primary/40 pointer-events-none flex items-center justify-center"
          >
            <span className="text-7xl md:text-9xl font-bold text-primary-foreground tracking-tight">TIME!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="font-semibold text-foreground tracking-tight">{activeSession.name}</h1>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            Exercise {activeExerciseIndex + 1} of {total}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFullscreen}
            title="Fullscreen"
            className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
          >
            <Maximize2 className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={stopMatchday}
            className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((activeExerciseIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Swipeable content */}
      <div className="flex-1 overflow-hidden touch-pan-y">
        <AnimatePresence mode="wait">
          <motion.div
            key={exercise.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.25 }}
            className="h-full overflow-y-auto"
          >
            <div className="max-w-3xl mx-auto p-6 md:p-10">
              <div className="text-center mb-6">
                <span className="text-5xl mb-3 block">{ex.icon}</span>
                <h2 className="text-3xl md:text-5xl font-semibold text-foreground tracking-tight">
                  {ex.title}
                </h2>
                <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
                  <span className="text-sm text-muted-foreground">{ex.players} players</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground capitalize">{ex.fieldSize} field</span>
                </div>
              </div>

              {/* Timer */}
              <div className={`rounded-lg p-6 mb-6 transition-colors ${secondsLeft === 0 ? "bg-primary/10" : "bg-muted"}`}>
                <div className="text-center">
                  <div className="text-6xl md:text-8xl font-mono font-bold tabular-nums text-foreground">
                    {formatTime(secondsLeft)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                    of {ex.duration} min
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mt-5">
                  <button
                    onClick={() => setRunning((r) => !r)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity min-w-[110px] justify-center"
                  >
                    {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> {secondsLeft === 0 ? "Restart" : "Start"}</>}
                  </button>
                  <button
                    onClick={() => { setRunning(false); setSecondsLeft(initialSeconds); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-muted-foreground/10 text-foreground font-medium text-sm hover:bg-muted-foreground/20 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                  {canNext && (
                    <button
                      onClick={() => { setRunning(false); goNext(); }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-muted-foreground/10 text-foreground font-medium text-sm hover:bg-muted-foreground/20 transition-colors"
                    >
                      <SkipForward className="w-4 h-4" /> Skip
                    </button>
                  )}
                </div>
              </div>

              {/* Field visualization */}
              <div className="aspect-[4/3] bg-muted rounded-md mb-6 overflow-hidden">
                {ex.previewImageUrl ? (
                  <img src={ex.previewImageUrl} alt={ex.title} className="w-full h-full object-cover" />
                ) : ex.fieldDiagram ? (
                  <FieldPreview diagram={ex.fieldDiagram} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-7xl opacity-20">{ex.icon}</span>
                  </div>
                )}
              </div>

              <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
                {ex.description}
              </p>

              {exercise.notes && (
                <div className="mt-6 p-4 bg-muted rounded-md">
                  <p className="text-sm font-medium text-foreground mb-1">Coach Notes</p>
                  <p className="text-sm text-muted-foreground">{exercise.notes}</p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-border p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={!canPrev}
            className="flex items-center gap-2 px-5 py-3 rounded-md text-sm font-medium transition-all disabled:opacity-30 hover:bg-muted min-w-[120px]"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <div className="flex gap-1.5 overflow-x-auto max-w-[200px]">
            {activeSession.exercises.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveExerciseIndex(i)}
                className={`h-2 rounded-full transition-all flex-shrink-0 ${
                  i === activeExerciseIndex ? "bg-primary w-6" : "bg-muted-foreground/30 w-2"
                }`}
              />
            ))}
          </div>
          <button
            onClick={goNext}
            disabled={!canNext}
            className="flex items-center gap-2 px-5 py-3 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-all disabled:opacity-30 hover:opacity-90 min-w-[120px] justify-center"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
