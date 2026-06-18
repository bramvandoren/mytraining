import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useCreateEvaluation, RATING_FIELDS } from "@/hooks/usePlayerEvaluations";

interface Props {
  clubId: string;
  playerId: string;
  onClose: () => void;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export function EvaluationForm({ clubId, playerId, onClose }: Props) {
  const create = useCreateEvaluation();
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().slice(0, 10));
  const [ratings, setRatings] = useState<Record<string, number | null>>({
    technical_rating: null,
    tactical_rating: null,
    physical_rating: null,
    mental_rating: null,
    overall_rating: null,
  });
  const [strengths, setStrengths] = useState("");
  const [areasToImprove, setAreasToImprove] = useState("");
  const [coachNotes, setCoachNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({
        club_id: clubId,
        player_id: playerId,
        evaluation_date: evaluationDate,
        technical_rating: ratings.technical_rating,
        tactical_rating: ratings.tactical_rating,
        physical_rating: ratings.physical_rating,
        mental_rating: ratings.mental_rating,
        overall_rating: ratings.overall_rating,
        strengths: strengths.trim() || null,
        areas_to_improve: areasToImprove.trim() || null,
        coach_notes: coachNotes.trim() || null,
      });
      toast.success("Evaluation saved");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save evaluation");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative bg-background border border-border rounded-xl shadow-lg w-full max-w-lg mx-4 p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">New evaluation</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
            <input
              type="date"
              value={evaluationDate}
              onChange={(e) => setEvaluationDate(e.target.value)}
              required
              className="w-full border border-border rounded-md px-3 h-9 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {RATING_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
                <select
                  value={ratings[key] ?? ""}
                  onChange={(e) => setRatings((r) => ({ ...r, [key]: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-border rounded-md px-3 h-9 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">—</option>
                  {RATING_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Strengths</label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={2}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-y focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Areas to improve</label>
            <textarea
              value={areasToImprove}
              onChange={(e) => setAreasToImprove(e.target.value)}
              rows={2}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-y focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Coach notes</label>
            <textarea
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              rows={2}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background resize-y focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 h-9 rounded-md border border-border text-sm hover:bg-muted">
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="px-4 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {create.isPending ? "Saving…" : "Save evaluation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
