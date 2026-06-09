import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useCreateTeam, useUpdateTeam, type Team } from "@/hooks/useTeams";

const AGE_GROUPS = ["U6", "U7", "U8", "U9", "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18", "U19", "U21", "Senior", "First Team"];
const COLORS = ["#16a34a", "#2563eb", "#dc2626", "#f59e0b", "#9333ea", "#0891b2", "#db2777", "#475569"];

export function TeamForm({ clubId, team, onClose }: { clubId: string; team?: Team; onClose: () => void }) {
  const [name, setName] = useState(team?.name ?? "");
  const [age, setAge] = useState(team?.age_category ?? "");
  const [color, setColor] = useState(team?.color ?? COLORS[0]);
  const [notes, setNotes] = useState(team?.notes ?? "");
  const create = useCreateTeam();
  const update = useUpdateTeam();
  const pending = create.isPending || update.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (team) {
        await update.mutateAsync({ id: team.id, name: name.trim(), age_category: age || null, color, notes: notes || null });
        toast.success("Team updated");
      } else {
        await create.mutateAsync({ club_id: clubId, name: name.trim(), age_category: age || null, color, notes: notes || null });
        toast.success("Team created");
      }
      onClose();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base">{team ? "Edit team" : "Create team"}</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="t-name">Name</label>
            <input id="t-name" autoFocus value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. U10 Saturday"
              className="mt-1 w-full px-3 py-2 text-sm bg-muted rounded-md outline-none focus:ring-2 ring-primary" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="t-age">Age category</label>
            <select id="t-age" value={age} onChange={(e) => setAge(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm bg-muted rounded-md outline-none focus:ring-2 ring-primary">
              <option value="">—</option>
              {AGE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Color</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setColor(c)} aria-label={`Color ${c}`}
                  className={`w-7 h-7 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="t-notes">Notes</label>
            <textarea id="t-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              className="mt-1 w-full px-3 py-2 text-sm bg-muted rounded-md outline-none focus:ring-2 ring-primary resize-none" />
          </div>
          <button type="submit" disabled={pending || !name.trim()}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {pending ? "Saving…" : team ? "Save changes" : "Create team"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
