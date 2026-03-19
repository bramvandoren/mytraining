import { useSessionStore } from "@/store/sessionStore";
import { Play, Trash2, Clock, Users, Calendar, Edit3 } from "lucide-react";
import { motion } from "framer-motion";

export function SavedSessions() {
  const { savedSessions, deleteSession, startMatchday, loadSession } = useSessionStore();

  if (savedSessions.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-muted-foreground text-sm">No saved sessions yet</p>
        <p className="text-muted-foreground text-xs mt-1">Build your first session from the library</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {savedSessions.map((session, index) => {
        const totalDuration = session.exercises.reduce((s, e) => s + e.exercise.duration, 0);
        return (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-md bg-card shadow-card p-4 hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground tracking-tight">{session.name}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono tabular-nums">
                    <Calendar className="w-3 h-3" />
                    {session.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {session.ageGroup}
                  </span>
                  <span className="flex items-center gap-1 font-mono tabular-nums">
                    <Clock className="w-3 h-3" />
                    {totalDuration}m
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              {session.exercises.slice(0, 5).map((ex) => (
                <span key={ex.id} className="text-lg" title={ex.exercise.title}>
                  {ex.exercise.icon}
                </span>
              ))}
              {session.exercises.length > 5 && (
                <span className="text-xs text-muted-foreground font-mono">
                  +{session.exercises.length - 5}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => startMatchday(session)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Play className="w-3 h-3" />
                Start
              </button>
              <button
                onClick={() => loadSession(session)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-muted text-muted-foreground text-xs font-medium hover:text-foreground transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={() => deleteSession(session.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all ml-auto"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
