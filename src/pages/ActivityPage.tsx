import { PageShell } from "@/components/PageShell";
import { useActiveClub } from "@/hooks/useClubs";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useProfiles } from "@/hooks/useProfiles";
import { Activity, Dumbbell, BookOpen, ClipboardList, Users, FileText } from "lucide-react";

const ICONS: Record<string, any> = {
  training_created: BookOpen,
  template_created: FileText,
  exercise_created: Dumbbell,
  team_created: ClipboardList,
  coach_joined: Users,
};
const LABELS: Record<string, string> = {
  training_created: "created a training",
  template_created: "created a template",
  exercise_created: "added an exercise",
  team_created: "created a team",
  coach_joined: "joined the club",
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ActivityPage() {
  const { active } = useActiveClub();
  const { data: activity = [], isLoading } = useActivityFeed(active?.id ?? null, 100);
  const { data: profiles = {} } = useProfiles(activity.map((a) => a.user_id ?? ""));

  if (!active) return <PageShell title="Activity"><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;

  return (
    <PageShell title="Activity" subtitle={`Recent activity in ${active.name}`}>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : activity.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-lg">
          <Activity className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        </div>
      ) : (
        <ol className="relative border-l border-border ml-2 space-y-3 pl-4">
          {activity.map((a) => {
            const Icon = ICONS[a.action] ?? Activity;
            const p = a.user_id ? profiles[a.user_id] : null;
            return (
              <li key={a.id} className="relative">
                <span className="absolute -left-[26px] top-0 w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                  <Icon className="w-3 h-3" />
                </span>
                <div className="bg-card border border-border rounded-md px-3 py-2">
                  <p className="text-sm">
                    <span className="font-medium">{p?.display_name ?? "Someone"}</span>{" "}
                    <span className="text-muted-foreground">{LABELS[a.action] ?? a.action}</span>
                    {a.metadata?.name && <span> — <span className="font-medium">{a.metadata.name}</span></span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(a.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </PageShell>
  );
}
