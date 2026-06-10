import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  useMatchReport, useSaveReport, useMatchEvents, useAddMatchEvent, useDeleteMatchEvent,
  type MatchEventType,
} from "@/hooks/useMatches";
import { usePlayers, useTeamRoster, type Player } from "@/hooks/usePlayers";

const EVENT_LABEL: Record<MatchEventType, string> = {
  goal: "Goal", assist: "Assist", yellow_card: "Yellow", red_card: "Red",
};
const EVENT_COLOR: Record<MatchEventType, string> = {
  goal: "bg-emerald-500", assist: "bg-sky-500", yellow_card: "bg-amber-400", red_card: "bg-rose-500",
};

export function MatchReportForm({ matchId, clubId, teamId, canEdit }: { matchId: string; clubId: string; teamId: string | null; canEdit: boolean }) {
  const { data: report } = useMatchReport(matchId);
  const save = useSaveReport();
  const { data: events = [] } = useMatchEvents(matchId);
  const addEvent = useAddMatchEvent();
  const delEvent = useDeleteMatchEvent();
  const { data: roster = [] } = useTeamRoster(teamId);
  const { data: all = [] } = usePlayers(clubId);
  const players: Player[] = teamId ? roster : all;

  const [form, setForm] = useState({
    our_score: "", opp_score: "", ht_our_score: "", ht_opp_score: "",
    what_went_well: "", what_to_improve: "", next_training_focus: "",
  });

  useEffect(() => {
    if (report) {
      setForm({
        our_score: report.our_score?.toString() ?? "",
        opp_score: report.opp_score?.toString() ?? "",
        ht_our_score: report.ht_our_score?.toString() ?? "",
        ht_opp_score: report.ht_opp_score?.toString() ?? "",
        what_went_well: report.what_went_well ?? "",
        what_to_improve: report.what_to_improve ?? "",
        next_training_focus: report.next_training_focus ?? "",
      });
    }
  }, [report]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    try {
      await save.mutateAsync({
        match_id: matchId,
        our_score: form.our_score === "" ? null : Number(form.our_score),
        opp_score: form.opp_score === "" ? null : Number(form.opp_score),
        ht_our_score: form.ht_our_score === "" ? null : Number(form.ht_our_score),
        ht_opp_score: form.ht_opp_score === "" ? null : Number(form.ht_opp_score),
        what_went_well: form.what_went_well || null,
        what_to_improve: form.what_to_improve || null,
        next_training_focus: form.next_training_focus || null,
      });
      toast.success("Report saved");
    } catch (e: any) { toast.error(e.message); }
  };

  /* event composer */
  const [evtType, setEvtType] = useState<MatchEventType>("goal");
  const [evtPlayer, setEvtPlayer] = useState<string>("");
  const [evtMinute, setEvtMinute] = useState<string>("");
  const [evtNote, setEvtNote] = useState<string>("");

  const onAddEvent = async () => {
    try {
      await addEvent.mutateAsync({
        match_id: matchId, event_type: evtType,
        player_id: evtPlayer || null,
        minute: evtMinute === "" ? null : Number(evtMinute),
        note: evtNote || null,
      });
      setEvtMinute(""); setEvtNote("");
    } catch (e: any) { toast.error(e.message); }
  };

  const playerName = (id: string | null) => {
    if (!id) return "Unknown";
    const p = players.find((x) => x.id === id);
    return p ? `${p.first_name} ${p.last_name}` : "—";
  };

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Final score</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Our score"><input type="number" disabled={!canEdit} value={form.our_score} onChange={(e) => set("our_score", e.target.value)} className={inputCls} /></Field>
          <Field label="Opponent score"><input type="number" disabled={!canEdit} value={form.opp_score} onChange={(e) => set("opp_score", e.target.value)} className={inputCls} /></Field>
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Halftime</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Our HT"><input type="number" disabled={!canEdit} value={form.ht_our_score} onChange={(e) => set("ht_our_score", e.target.value)} className={inputCls} /></Field>
          <Field label="Opponent HT"><input type="number" disabled={!canEdit} value={form.ht_opp_score} onChange={(e) => set("ht_opp_score", e.target.value)} className={inputCls} /></Field>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Events</h3>
        {canEdit && (
          <div className="bg-card border border-border rounded-lg p-3 mb-3 grid grid-cols-2 md:grid-cols-5 gap-2">
            <select value={evtType} onChange={(e) => setEvtType(e.target.value as MatchEventType)} className={inputCls}>
              {(Object.keys(EVENT_LABEL) as MatchEventType[]).map((k) => <option key={k} value={k}>{EVENT_LABEL[k]}</option>)}
            </select>
            <select value={evtPlayer} onChange={(e) => setEvtPlayer(e.target.value)} className={inputCls + " col-span-2 md:col-span-1"}>
              <option value="">— Player —</option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
            <input type="number" placeholder="Min" value={evtMinute} onChange={(e) => setEvtMinute(e.target.value)} className={inputCls} />
            <input placeholder="Note" value={evtNote} onChange={(e) => setEvtNote(e.target.value)} className={inputCls} />
            <button onClick={onAddEvent} className="h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center justify-center gap-1.5 hover:bg-primary/90 col-span-2 md:col-span-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        )}

        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">No events recorded yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-2 text-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${EVENT_COLOR[e.event_type]}`} />
                <span className="text-xs font-medium w-12 tabular-nums text-muted-foreground">{e.minute != null ? `${e.minute}'` : "—"}</span>
                <span className="font-medium flex-1 min-w-0 truncate">{EVENT_LABEL[e.event_type]} · {playerName(e.player_id)}</span>
                {e.note && <span className="text-xs text-muted-foreground truncate">{e.note}</span>}
                {canEdit && (
                  <button onClick={() => delEvent.mutate({ id: e.id, matchId })} className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coach evaluation</h3>
        <Field label="What went well">
          <textarea disabled={!canEdit} rows={3} value={form.what_went_well} onChange={(e) => set("what_went_well", e.target.value)} className={inputCls} />
        </Field>
        <Field label="What to improve">
          <textarea disabled={!canEdit} rows={3} value={form.what_to_improve} onChange={(e) => set("what_to_improve", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Next training focus">
          <textarea disabled={!canEdit} rows={3} value={form.next_training_focus} onChange={(e) => set("next_training_focus", e.target.value)} className={inputCls} />
        </Field>
      </section>

      {canEdit && (
        <div className="flex justify-end">
          <button onClick={onSave} disabled={save.isPending}
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            Save report
          </button>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full min-h-10 px-3 py-2 rounded-md border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}
