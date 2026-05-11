import { useSessionStore } from "@/store/sessionStore";
import { useTrainingSessions, useDeleteSession } from "@/hooks/useTrainingSessions";
import { useEnableShare } from "@/hooks/useShareSession";
import { useProfiles } from "@/hooks/useProfiles";
import { Play, Trash2, Clock, Users, Calendar, Edit3, User, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function SavedSessions() {
  const { startMatchday, loadSession } = useSessionStore();
  const { data: sessions = [], isLoading } = useTrainingSessions();
  const deleteSession = useDeleteSession();
  const enableShare = useEnableShare();

  const creatorIds = [...new Set(sessions.map((s) => s.user_id))];
  const { data: profiles = {} } = useProfiles(creatorIds);

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground text-sm">Loading sessions...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-muted-foreground text-sm">No saved sessions yet</p>
        <p className="text-muted-foreground text-xs mt-1">Build your first session from the library</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, index) => {
        const creator = profiles[session.user_id]?.display_name;
        return (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-md bg-card shadow-card p-4 hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground tracking-tight truncate">{session.name}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
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
                    {session.total_duration}m
                  </span>
                  {creator && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {creator}
                    </span>
                  )}
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
                onClick={async () => {
                  try {
                    const token = session.share_token ?? await enableShare.mutateAsync(session.id);
                    const url = `${window.location.origin}/share/${token}`;
                    await navigator.clipboard.writeText(url);
                    toast.success("Share link copied to clipboard");
                  } catch (e: any) { toast.error(e.message ?? "Share failed"); }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-muted text-muted-foreground text-xs font-medium hover:text-foreground transition-colors"
                title="Copy public share link"
              >
                <Share2 className="w-3 h-3" />
                Share
              </button>
              <button
                onClick={() => deleteSession.mutate(session.id)}
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
