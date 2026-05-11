import { useState } from "react";
import { format, addWeeks, startOfWeek, parseISO, differenceInWeeks } from "date-fns";
import { Plus, Trash2, ChevronDown, ChevronRight, Target } from "lucide-react";
import { useSeasons, useCreateSeason, useDeleteSeason, useWeeklyPlans, useUpsertWeeklyPlan } from "@/hooks/useSeasons";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export function SeasonPlanner() {
  const { data: seasons = [] } = useSeasons();
  const createSeason = useCreateSeason();
  const delSeason = useDeleteSeason();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const active = seasons.find((s) => s.id === activeId) ?? seasons[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-semibold text-lg tracking-tight">Season Planner</h2>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> New Season
        </button>
      </div>
      {seasons.length === 0 && !showNew && (
        <div className="text-center py-12 text-muted-foreground text-sm">No seasons yet.</div>
      )}
      {seasons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {seasons.map((s) => (
            <button key={s.id} onClick={() => setActiveId(s.id)}
              className={`px-3 py-1.5 rounded-sm text-sm transition-all flex items-center gap-2 ${
                (active?.id === s.id) ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}>
              {s.name}
              <Trash2 onClick={(e) => { e.stopPropagation(); if (confirm("Delete season?")) delSeason.mutate(s.id); }}
                className="w-3 h-3 opacity-50 hover:opacity-100" />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showNew && (
          <NewSeasonForm onSave={async (s) => {
            try { await createSeason.mutateAsync(s); toast.success("Season created"); setShowNew(false); }
            catch (e: any) { toast.error(e.message); }
          }} onCancel={() => setShowNew(false)} />
        )}
      </AnimatePresence>

      {active && <SeasonWeeks season={active} />}
    </div>
  );
}

function NewSeasonForm({ onSave, onCancel }: { onSave: (s: { name: string; start_date: string; end_date: string }) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [start, setStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [end, setEnd] = useState(format(addWeeks(new Date(), 12), "yyyy-MM-dd"));
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
      className="bg-card shadow-card rounded-md p-4 space-y-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Season name..."
        className="w-full px-3 py-2 text-sm bg-muted rounded-md outline-none" />
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="px-3 py-2 text-sm bg-muted rounded-md outline-none" />
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="px-3 py-2 text-sm bg-muted rounded-md outline-none" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
        <button onClick={() => name.trim() && onSave({ name: name.trim(), start_date: start, end_date: end })}
          className="px-3 py-1.5 rounded-sm bg-primary text-primary-foreground text-sm font-medium">Create</button>
      </div>
    </motion.div>
  );
}

function SeasonWeeks({ season }: { season: any }) {
  const { data: plans = [] } = useWeeklyPlans(season.id);
  const upsert = useUpsertWeeklyPlan();
  const { data: sessions = [] } = useTrainingSessions();
  const [openWeek, setOpenWeek] = useState<string | null>(null);

  const start = startOfWeek(parseISO(season.start_date));
  const end = parseISO(season.end_date);
  const totalWeeks = Math.max(1, differenceInWeeks(end, start) + 1);
  const weeks = Array.from({ length: totalWeeks }, (_, i) => addWeeks(start, i));

  const planByWeek = Object.fromEntries(plans.map((p) => [p.week_start, p]));

  return (
    <div className="space-y-1.5">
      {weeks.map((week, i) => {
        const key = format(week, "yyyy-MM-dd");
        const plan = planByWeek[key];
        const isOpen = openWeek === key;
        const weekSessions = (plan?.session_ids ?? []).map((id) => sessions.find((s) => s.id === id)).filter(Boolean) as any[];
        return (
          <div key={key} className="bg-card shadow-card rounded-md overflow-hidden">
            <button onClick={() => setOpenWeek(isOpen ? null : key)} className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-medium text-sm">Week {i + 1}</span>
                <span className="text-xs text-muted-foreground font-mono">{format(week, "MMM d")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {plan?.goals && <Target className="w-3 h-3 text-primary" />}
                <span className="font-mono">{weekSessions.length} sessions</span>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-border p-3 space-y-2">
                <textarea defaultValue={plan?.goals ?? ""} placeholder="Weekly goals..."
                  onBlur={(e) => upsert.mutate({ season_id: season.id, week_start: key, goals: e.target.value, session_ids: plan?.session_ids ?? [] })}
                  rows={2} className="w-full px-3 py-2 text-sm bg-muted rounded-md outline-none resize-none" />
                <div>
                  <p className="text-xs font-medium mb-1.5">Assigned trainings</p>
                  <div className="space-y-1">
                    {weekSessions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between bg-muted/50 rounded-sm px-2 py-1.5 text-sm">
                        <span>{s.name}</span>
                        <button onClick={() => upsert.mutate({ season_id: season.id, week_start: key, goals: plan?.goals ?? undefined, session_ids: (plan?.session_ids ?? []).filter((x) => x !== s.id) })}
                          className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                  <select onChange={(e) => {
                    if (!e.target.value) return;
                    const ids = [...(plan?.session_ids ?? []), e.target.value];
                    upsert.mutate({ season_id: season.id, week_start: key, goals: plan?.goals ?? undefined, session_ids: ids });
                    e.target.value = "";
                  }} className="w-full mt-1 px-3 py-2 text-sm bg-muted rounded-md outline-none">
                    <option value="">+ Add training to week...</option>
                    {sessions.filter((s) => !(plan?.session_ids ?? []).includes(s.id)).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
