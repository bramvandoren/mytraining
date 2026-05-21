import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSessionStore } from "@/store/sessionStore";
import { useTrainingSessions, useDeleteSession, CloudSession } from "@/hooks/useTrainingSessions";
import { useEnableShare } from "@/hooks/useShareSession";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { useActiveClub } from "@/hooks/useClubs";
import { Play, Trash2, Clock, Users, Calendar, Edit3, User, Share2, BookOpen, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ListSkeleton, EmptyState, ErrorState } from "@/components/QueryState";
import { cn } from "@/lib/utils";

type Tab = "mine" | "shared" | "recent";

function TrainingCard({ session, isMine, creatorName, clubName, onStart, onLoad, onShare, onDelete, t }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-md bg-card shadow-card p-4 hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground tracking-tight truncate">{session.name}</h3>
            {isMine ? (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary uppercase tracking-wide">
                {t("trainings.owner")}
              </span>
            ) : (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-700 uppercase tracking-wide">
                {t("trainings.external")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1 font-mono tabular-nums"><Calendar className="w-3 h-3" />{session.date}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{session.ageGroup}</span>
            <span className="flex items-center gap-1 font-mono tabular-nums"><Clock className="w-3 h-3" />{session.total_duration}{t("common.min")}</span>
            {creatorName && !isMine && (
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {creatorName}</span>
            )}
            {clubName && (
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {clubName}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-2">
        {session.exercises.slice(0, 5).map((ex: any) => (
          <span key={ex.id} className="text-lg" title={ex.exercise.title}>{ex.exercise.icon}</span>
        ))}
        {session.exercises.length > 5 && (
          <span className="text-xs text-muted-foreground font-mono">+{session.exercises.length - 5}</span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button onClick={onStart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
          <Play className="w-3 h-3" />{t("common.start")}
        </button>
        {isMine && (
          <button onClick={onLoad}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-muted text-muted-foreground text-xs font-medium hover:text-foreground transition-colors">
            <Edit3 className="w-3 h-3" />{t("common.edit")}
          </button>
        )}
        {isMine && (
          <button onClick={onShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-muted text-muted-foreground text-xs font-medium hover:text-foreground transition-colors">
            <Share2 className="w-3 h-3" />{t("common.share")}
          </button>
        )}
        {isMine && (
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all ml-auto">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function SavedSessions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { startMatchday, loadSession, recentTrainingIds } = useSessionStore();
  const { data: sessions = [], isLoading, isError, error, refetch } = useTrainingSessions();
  const { clubs } = useActiveClub();
  const deleteSession = useDeleteSession();
  const enableShare = useEnableShare();
  const [tab, setTab] = useState<Tab>("mine");

  const creatorIds = [...new Set(sessions.map((s) => s.user_id))];
  const { data: profiles = {} } = useProfiles(creatorIds);
  const clubNameById = useMemo(() => Object.fromEntries(clubs.map((c) => [c.id, c.name])), [clubs]);

  const mine = useMemo(() => sessions.filter((s) => user && s.user_id === user.id), [sessions, user]);
  const shared = useMemo(() => sessions.filter((s) => user && s.user_id !== user.id), [sessions, user]);
  const recent = useMemo(() => {
    const byId = new Map(sessions.map((s) => [s.id, s]));
    return recentTrainingIds.map((id) => byId.get(id)).filter(Boolean) as CloudSession[];
  }, [sessions, recentTrainingIds]);

  if (isLoading) return <ListSkeleton count={4} height="h-28" />;
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "mine", label: t("trainings.tabs.mine"), count: mine.length },
    { key: "shared", label: t("trainings.tabs.shared"), count: shared.length },
    { key: "recent", label: t("trainings.tabs.recent"), count: recent.length },
  ];

  const list = tab === "mine" ? mine : tab === "shared" ? shared : recent;

  const handleShare = async (s: CloudSession) => {
    try {
      const token = s.share_token ?? (await enableShare.mutateAsync(s.id));
      const url = `${window.location.origin}/share/${token}`;
      await navigator.clipboard.writeText(url);
      toast.success(t("trainings.shareCopied"));
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tt) => (
          <button
            key={tt.key}
            onClick={() => setTab(tt.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              tab === tt.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tt.label}
            <span className="text-[10px] font-mono tabular-nums bg-muted rounded-full px-1.5 py-0.5">
              {tt.count}
            </span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={
            tab === "mine" ? t("trainings.empty")
            : tab === "shared" ? t("trainings.emptyShared")
            : t("trainings.emptyRecent")
          }
          description={tab === "mine" ? t("trainings.emptyDesc") : undefined}
        />
      ) : (
        <div className="space-y-3">
          {list.map((session) => {
            const isMine = !!user && session.user_id === user.id;
            const creatorName = profiles[session.user_id]?.display_name;
            const clubName = session.club_id ? clubNameById[session.club_id] : undefined;
            return (
              <TrainingCard
                key={session.id}
                session={session}
                isMine={isMine}
                creatorName={creatorName}
                clubName={clubName}
                onStart={() => startMatchday(session)}
                onLoad={() => loadSession(session)}
                onShare={() => handleShare(session)}
                onDelete={() => deleteSession.mutate(session.id)}
                t={t}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
