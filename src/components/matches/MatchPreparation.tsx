import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Save, Target, Zap, Eye, MessageSquare, Star } from "lucide-react";
import { useMatchPreparation, useSaveMatchPreparation } from "@/hooks/useMatchPreparation";
import { toast } from "sonner";

interface FormState {
  match_objectives: string;
  tactical_notes: string;
  opponent_analysis: string;
  coach_notes: string;
  key_focus_points: string;
}

interface Props {
  matchId: string;
  canEdit: boolean;
}

export function MatchPreparation({ matchId, canEdit }: Props) {
  const { t } = useTranslation();
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

  const SECTIONS: { key: keyof FormState; label: string; icon: typeof Target; placeholder: string }[] = [
    { key: "match_objectives", label: t("matchPrep.objectives"), icon: Target, placeholder: t("matchPrep.objectivesPlaceholder") },
    { key: "tactical_notes", label: t("matchPrep.tactical"), icon: Zap, placeholder: t("matchPrep.tacticalPlaceholder") },
    { key: "opponent_analysis", label: t("matchPrep.opponent"), icon: Eye, placeholder: t("matchPrep.opponentPlaceholder") },
    { key: "coach_notes", label: t("matchPrep.coachNotes"), icon: MessageSquare, placeholder: t("matchPrep.coachNotesPlaceholder") },
    { key: "key_focus_points", label: t("matchPrep.keyFocus"), icon: Star, placeholder: t("matchPrep.keyFocusPlaceholder") },
  ];

  async function handleSave() {
    try {
      await save.mutateAsync({ match_id: matchId, ...form });
      toast.success(t("matchPrep.saved"));
    } catch {
      toast.error(t("matchPrep.saveFailed"));
    }
  }

  const isEmpty = !prep;

  return (
    <div className="space-y-4">
      {isEmpty && !canEdit && (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {t("matchPrep.empty")}
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
          {save.isPending ? t("matchPrep.saving") : t("matchPrep.save")}
        </button>
      )}
    </div>
  );
}
