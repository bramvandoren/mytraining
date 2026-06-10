import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useCreateMatch, useUpdateMatch, type Match } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";

interface Props {
  clubId: string;
  existing?: Match | null;
  onClose: () => void;
}

export function MatchForm({ clubId, existing, onClose }: Props) {
  const create = useCreateMatch();
  const update = useUpdateMatch();
  const { data: teams = [] } = useTeams(clubId);

  const [form, setForm] = useState({
    opponent: existing?.opponent ?? "",
    match_date: existing?.match_date ?? new Date().toISOString().slice(0, 10),
    kickoff_time: existing?.kickoff_time ?? "",
    location: existing?.location ?? "",
    competition: existing?.competition ?? "",
    venue: existing?.venue ?? "home",
    match_type: existing?.match_type ?? "league",
    team_id: existing?.team_id ?? "",
    notes: existing?.notes ?? "",
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        team_id: form.team_id || null,
        kickoff_time: form.kickoff_time || null,
        club_id: clubId,
      };
      if (existing) await update.mutateAsync({ id: existing.id, ...payload } as any);
      else await create.mutateAsync(payload as any);
      toast.success(existing ? "Match updated" : "Match created");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        className="bg-background w-full md:max-w-lg md:rounded-xl rounded-t-xl border border-border max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background">
          <h2 className="font-semibold">{existing ? "Edit match" : "New match"}</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-4 space-y-3">
          <Field label="Opponent *">
            <input required value={form.opponent} onChange={(e) => set("opponent", e.target.value)} className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date *">
              <input type="date" required value={form.match_date} onChange={(e) => set("match_date", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Kickoff">
              <input type="time" value={form.kickoff_time} onChange={(e) => set("kickoff_time", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Venue">
              <select value={form.venue} onChange={(e) => set("venue", e.target.value)} className={inputCls}>
                <option value="home">Home</option>
                <option value="away">Away</option>
              </select>
            </Field>
            <Field label="Type">
              <select value={form.match_type} onChange={(e) => set("match_type", e.target.value)} className={inputCls}>
                <option value="league">League</option>
                <option value="cup">Cup</option>
                <option value="friendly">Friendly</option>
              </select>
            </Field>
          </div>

          <Field label="Team">
            <select value={form.team_id} onChange={(e) => set("team_id", e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>

          <Field label="Competition">
            <input value={form.competition} onChange={(e) => set("competition", e.target.value)} placeholder="e.g. U15 District Cup" className={inputCls} />
          </Field>

          <Field label="Location">
            <input value={form.location} onChange={(e) => set("location", e.target.value)} className={inputCls} />
          </Field>

          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className={inputCls} />
          </Field>
        </div>

        <footer className="p-4 border-t border-border flex justify-end gap-2 sticky bottom-0 bg-background">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border border-border text-sm hover:bg-muted">Cancel</button>
          <button type="submit" disabled={create.isPending || update.isPending}
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {existing ? "Save" : "Create"}
          </button>
        </footer>
      </form>
    </div>
  );
}

const inputCls = "w-full h-10 px-3 rounded-md border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}
