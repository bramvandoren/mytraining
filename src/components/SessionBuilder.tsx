import { useSessionStore } from "@/store/sessionStore";
import { GripVertical, X, MessageSquare, Save, Play, Trash2 } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useState } from "react";
import { AgeGroup } from "@/data/exercises";

const ageGroups: AgeGroup[] = ["U6", "U8", "U10", "U12", "U14", "U16", "U18", "Senior"];

export function SessionBuilder() {
  const {
    currentExercises, sessionName, sessionDate, sessionAgeGroup,
    setSessionName, setSessionDate, setSessionAgeGroup,
    removeExercise, updateNotes, reorderExercises, saveSession, clearCurrentSession,
  } = useSessionStore();

  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);

  const totalDuration = currentExercises.reduce((sum, e) => sum + e.exercise.duration, 0);

  const handleReorder = (newOrder: typeof currentExercises) => {
    // Find what moved
    const newIds = newOrder.map(e => e.id);
    const oldIds = currentExercises.map(e => e.id);
    for (let i = 0; i < newIds.length; i++) {
      if (newIds[i] !== oldIds[i]) {
        const fromIndex = oldIds.indexOf(newIds[i]);
        reorderExercises(fromIndex, i);
        break;
      }
    }
  };

  const handleSave = () => {
    if (!sessionName.trim()) return;
    saveSession();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground tracking-tight text-lg">Session Builder</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-mono text-muted-foreground tabular-nums">
            {currentExercises.length} Drills
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-sm font-mono text-muted-foreground tabular-nums">
            {totalDuration} Min
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3 border-b border-border">
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Session name..."
          className="w-full px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 font-mono text-muted-foreground"
          />
          <select
            value={sessionAgeGroup}
            onChange={(e) => setSessionAgeGroup(e.target.value as AgeGroup)}
            className="px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 text-muted-foreground"
          >
            {ageGroups.map((ag) => (
              <option key={ag} value={ag}>{ag}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {currentExercises.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="space-y-2 opacity-40">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 w-full rounded-md border-2 border-dashed border-border" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Add exercises from the library
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline rail */}
            <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-primary rounded-full" />

            <Reorder.Group
              axis="y"
              values={currentExercises}
              onReorder={handleReorder}
              className="space-y-2"
            >
              <AnimatePresence>
                {currentExercises.map((item, index) => (
                  <Reorder.Item
                    key={item.id}
                    value={item}
                    className="relative"
                  >
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.2 }}
                      className="flex items-start gap-2 bg-card rounded-md shadow-card p-3 ml-6 cursor-grab active:cursor-grabbing hover:shadow-card-hover transition-shadow"
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-5 w-[10px] h-[10px] rounded-full bg-primary border-2 border-background" />

                      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg">{item.exercise.icon}</span>
                            <span className="text-sm font-semibold text-foreground truncate">
                              {item.exercise.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-xs font-mono text-muted-foreground tabular-nums">
                              {item.exercise.duration}m
                            </span>
                            <button
                              onClick={() => setExpandedNotes(expandedNotes === item.id ? null : item.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-sm hover:bg-muted transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => removeExercise(item.id)}
                              className="w-6 h-6 flex items-center justify-center rounded-sm hover:bg-destructive/10 transition-colors"
                            >
                              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        </div>
                        <AnimatePresence>
                          {expandedNotes === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <textarea
                                value={item.notes}
                                onChange={(e) => updateNotes(item.id, e.target.value)}
                                placeholder="Add notes..."
                                className="w-full mt-2 px-2 py-1.5 text-xs bg-muted rounded-sm border-0 outline-none resize-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground"
                                rows={2}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          </div>
        )}
      </div>

      {currentExercises.length > 0 && (
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={handleSave}
            disabled={!sessionName.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Save Session
          </button>
          <button
            onClick={clearCurrentSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-sm text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
