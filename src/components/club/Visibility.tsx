import { cn } from "@/lib/utils";
import { Lock, Users, Globe, Shield } from "lucide-react";
import { useTeams } from "@/hooks/useTeams";

export type Visibility = "private" | "club" | "public" | "team";

export function VisibilityBadge({ visibility, className }: { visibility: Visibility; className?: string }) {
  const map = {
    private: { icon: Lock, label: "Private", cls: "bg-muted text-muted-foreground" },
    team: { icon: Shield, label: "Team", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    club: { icon: Users, label: "Club", cls: "bg-primary/10 text-primary" },
    public: { icon: Globe, label: "Public", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  } as const;
  const m = map[visibility];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-sm", m.cls, className)}>
      <Icon className="w-3 h-3" /> {m.label}
    </span>
  );
}

export function VisibilitySelector({
  value, onChange, allowClub = true, clubId, teamId, onTeamChange, disabled,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
  allowClub?: boolean;
  clubId?: string | null;
  teamId?: string | null;
  onTeamChange?: (id: string | null) => void;
  disabled?: boolean;
}) {
  const { data: teams = [] } = useTeams(allowClub ? clubId ?? null : null);
  const opts: { v: Visibility; label: string; desc: string }[] = [
    { v: "private", label: "Private", desc: "Only you" },
    ...(allowClub && teams.length > 0 ? [{ v: "team" as Visibility, label: "Team", desc: "Specific team" }] : []),
    ...(allowClub ? [{ v: "club" as Visibility, label: "Club", desc: "All club coaches" }] : []),
    { v: "public", label: "Public", desc: "Community marketplace" },
  ];

  return (
    <div className="space-y-2">
      <div className={cn("grid gap-2", opts.length === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-3")}>
        {opts.map((o) => (
          <button
            key={o.v}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.v)}
            className={cn(
              "text-left p-2 rounded-md border-2 transition-colors disabled:opacity-50",
              value === o.v ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30",
            )}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <VisibilityBadge visibility={o.v} />
            </div>
            <p className="text-[10px] text-muted-foreground">{o.desc}</p>
          </button>
        ))}
      </div>
      {value === "team" && (
        <select
          value={teamId ?? ""}
          onChange={(e) => onTeamChange?.(e.target.value || null)}
          className="w-full h-9 px-2 rounded-md bg-muted border border-border text-sm outline-none focus:border-primary"
        >
          <option value="">— Select a team —</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}
    </div>
  );
}
