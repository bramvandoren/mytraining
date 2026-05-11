import { useMemo } from "react";
import { useCustomExercises } from "@/hooks/useCustomExercises";
import { useExerciseLikes, useToggleLike } from "@/hooks/useExerciseLikes";
import { useProfiles } from "@/hooks/useProfiles";
import { useSessionStore } from "@/store/sessionStore";
import { Heart, Plus } from "lucide-react";
import { motion } from "framer-motion";

export function Marketplace() {
  const { data: custom = [] } = useCustomExercises();
  const { data: likeData = { mine: new Set<string>(), counts: {} } } = useExerciseLikes();
  const toggle = useToggleLike();
  const { addExercise } = useSessionStore();
  const creators = [...new Set(custom.filter((c) => c.userId).map((c) => c.userId!))];
  const { data: profiles = {} } = useProfiles(creators);

  const publicExercises = useMemo(
    () => custom.filter((c) => c.isPublic).sort((a, b) => (likeData.counts[b.customId] ?? 0) - (likeData.counts[a.customId] ?? 0)),
    [custom, likeData]
  );

  if (publicExercises.length === 0) {
    return <div className="text-center py-16 text-muted-foreground text-sm">No community exercises yet. Create one and mark it public!</div>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {publicExercises.map((ex, i) => {
        const liked = likeData.mine.has(ex.customId);
        const count = likeData.counts[ex.customId] ?? 0;
        return (
          <motion.div key={ex.customId}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="rounded-md bg-card shadow-card p-4 hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-2xl">{ex.icon}</span>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{ex.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    by {profiles[ex.userId!]?.display_name ?? "Unknown"} · {ex.duration}m
                  </p>
                </div>
              </div>
              <button onClick={() => toggle.mutate({ exerciseId: ex.customId, liked })}
                className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs ${liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
                <Heart className="w-3.5 h-3.5" fill={liked ? "currentColor" : "none"} />
                <span className="font-mono tabular-nums">{count}</span>
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ex.description}</p>
            <button onClick={() => addExercise(ex)}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-foreground text-background text-xs font-medium hover:opacity-90">
              <Plus className="w-3 h-3" /> Add to Session
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
