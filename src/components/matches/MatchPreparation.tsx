import { useState, useEffect } from "react";
import { Save, Target, Zap, Eye, MessageSquare, Star } from "lucide-react";
import { useMatchPreparation, useSaveMatchPreparation } from "@/hooks/useMatchPreparation";
import { toast } from "sonner";

interface Section {
  key: keyof FormState;
  label: string;
  icon: typeof Target;
  placeholder: string;
}

interface FormState {
  match_objectives: string;
  tactical_notes: string;
  opponent_analysis: string;
  coach_notes: string;
  key_focus_points: string;
}

const SECTIONS: Section[] = [
  {
    key: "match_objectives",
    label: "Match Objectives",
    icon: Target,
    placeholder: "What do we want to achieve in this match? Set the goals and mindset.",
  },
  {
    key: "tactical_notes",
    label: "Tactical Notes",
    icon: Zap,
    placeholder: "Formation, pressing triggers, defensive shape, set pieces…",
  },
  {
    key: "opponent_analysis",
    label: "Opponent Analysis",
    icon: Eye,
    placeholder: "Their key players, strengths to neutralize, weaknesses to exploit…",
  },
  {
    key: "coach_notes",
    label: "Coach Notes",
    icon: MessageSquare,
    placeholder: "Internal notes for the coaching staff…",
  },
  {
    key: "key_focus_points",
    label: "Key Focus Points",
    icon: Star,
    placeholder: "The 2–3 things every player must remember today…",
  },
];

interface Props {
  matchId: string;
  canEdit: boolean;
}

export function MatchPreparation({ matchId, canEdit }: Props) {
  const { data: prep } = useMatchPreparation(matchId);
  const save = useSaveMatchPreparation();

  const [form, setForm] = useState<FormState>({
    match_objectives: "",
    tactical_notes: "",
    opponent_analysis: "",
    coach_notes: "",
    key_focus_points: "",
  });

  useEffect(() => {
    if (prep) {
      setForm({
        match_objectives: prep.match_objectives ?? "",
        tactical_notes: prep.tactical_notes ?? "",
        opponent_analysis: prep.opponent_analysis ?? "",
        coach_notes: prep.coach_notes ?? "",
        key_focus_points: prep.key_focus_points ?? "",
      });
    }
  }, [prep]);

  async function handleSave() {
    try {
      await save.mutateAsync({ match_id: matchId, ...form });
      toast.success("Match preparation saved");
    } catch {
      toast.error("Failed to save");
    }
  }

  const isEmpty = !prep;

  return (
    <div className="space-y-4">
      {isEmpty && !canEdit && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          No match preparation added yet.
        </p>
      )}

      {SECTIONS.map(({ key, label, icon: Icon, placeholder }) => {
        const value = form[key];
        if (!canEdit && !value) return null;
        return (
          <div key={key} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">{label}</h3>
            </div>
            {canEdit ? (
              <textarea
                value={value}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                rows={3}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                {value}
              </p>
            )}
          </div>
        );
      })}

      {canEdit && (
        <button
          onClick={handleSave}
          disabled={save.isPending}
          className="inline-flex items-center gap-2 px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {save.isPending ? "Saving…" : "Save Preparation"}
        </button>
      )}
    </div>
  );
}
