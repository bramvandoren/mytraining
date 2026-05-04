import { useTemplates, useDeleteTemplate } from "@/hooks/useTemplates";
import { useSessionStore } from "@/store/sessionStore";
import { useProfiles } from "@/hooks/useProfiles";
import { Clock, Trash2, FilePlus, User, Bookmark } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function Templates() {
  const { data: templates = [], isLoading } = useTemplates();
  const del = useDeleteTemplate();
  const { loadFromTemplate } = useSessionStore();
  const creatorIds = [...new Set(templates.map((t) => t.user_id))];
  const { data: profiles = {} } = useProfiles(creatorIds);

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Loading templates...</div>;
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <Bookmark className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">No templates yet</p>
        <p className="text-muted-foreground text-xs mt-1">Save a session as template from the builder</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((t, i) => {
        const creator = profiles[t.user_id]?.display_name;
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-md bg-card shadow-card p-4 hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground tracking-tight truncate">{t.name}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1 font-mono tabular-nums">
                    <Clock className="w-3 h-3" /> {t.total_duration}m
                  </span>
                  <span className="font-mono tabular-nums">{t.exercises.length} drills</span>
                  {creator && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {creator}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              {t.exercises.slice(0, 6).map((ex, idx) => (
                <span key={idx} className="text-lg" title={ex.exercise.title}>
                  {ex.exercise.icon}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => {
                  loadFromTemplate(t.exercises, t.name);
                  toast.success("Template loaded into builder");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <FilePlus className="w-3 h-3" />
                Use Template
              </button>
              <button
                onClick={() => del.mutate(t.id)}
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
