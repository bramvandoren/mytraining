import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { useActiveClub } from "@/hooks/useClubs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useProfiles } from "@/hooks/useProfiles";
import { VisibilityBadge } from "@/components/club/Visibility";
import { Dumbbell, BookOpen, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "exercises" | "trainings" | "templates";

function useSharedExercises(clubId: string | null) {
  return useQuery({
    queryKey: ["shared_exercises", clubId],
    enabled: !!clubId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_exercises").select("id, title, description, user_id, visibility, icon, duration, players, exercise_type")
        .eq("club_id", clubId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}
function useSharedTrainings(clubId: string | null) {
  return useQuery({
    queryKey: ["shared_trainings", clubId],
    enabled: !!clubId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_sessions").select("id, name, age_group, total_duration, user_id, visibility, date")
        .eq("club_id", clubId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}
function useSharedTemplates(clubId: string | null) {
  return useQuery({
    queryKey: ["shared_templates", clubId],
    enabled: !!clubId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_templates").select("id, name, total_duration, user_id, visibility")
        .eq("club_id", clubId!).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export default function SharedLibraryPage() {
  const { active } = useActiveClub();
  const [tab, setTab] = useState<Tab>("exercises");
  const { data: ex = [] } = useSharedExercises(active?.id ?? null);
  const { data: tr = [] } = useSharedTrainings(active?.id ?? null);
  const { data: tp = [] } = useSharedTemplates(active?.id ?? null);
  const userIds = [...ex, ...tr, ...tp].map((x) => x.user_id);
  const { data: profiles = {} } = useProfiles(userIds);

  if (!active) return <PageShell title="Club library"><p className="text-sm text-muted-foreground">No club selected.</p></PageShell>;

  const TABS: { id: Tab; label: string; icon: any; count: number }[] = [
    { id: "exercises", label: "Exercises", icon: Dumbbell, count: ex.length },
    { id: "trainings", label: "Trainings", icon: BookOpen, count: tr.length },
    { id: "templates", label: "Templates", icon: FileText, count: tp.length },
  ];

  const items = tab === "exercises" ? ex : tab === "trainings" ? tr : tp;
  const emptyLabel = `No shared ${tab} yet.`;

  return (
    <PageShell title="Club library" subtitle={`Shared content in ${active.name}`}>
      <div className="flex gap-1 mb-4 border-b border-border" role="tablist">
        {TABS.map((tDef) => (
          <button key={tDef.id} role="tab" aria-selected={tab === tDef.id}
            onClick={() => setTab(tDef.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === tDef.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}>
            <tDef.icon className="w-3.5 h-3.5" /> {tDef.label}
            <span className="text-[10px] tabular-nums text-muted-foreground">({tDef.count})</span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">{emptyLabel}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it: any) => {
            const p = profiles[it.user_id];
            return (
              <article key={it.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm flex-1">
                    {tab === "exercises" ? `${it.icon ?? "⚽"} ${it.title}` : it.name}
                  </h3>
                  <VisibilityBadge visibility={(it.visibility ?? "club") as any} />
                </div>
                {tab === "exercises" && it.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{it.description}</p>
                )}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {p?.display_name ?? "Unknown"}</span>
                  <span>
                    {tab === "exercises" && `${it.duration ?? 0} min · ${it.players ?? 0}p`}
                    {tab === "trainings" && `${it.total_duration ?? 0} min · ${it.age_group ?? ""}`}
                    {tab === "templates" && `${it.total_duration ?? 0} min`}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
