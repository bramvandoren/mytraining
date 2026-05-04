import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addDays, addMonths, subMonths, addWeeks, subWeeks, isSameDay, isSameMonth, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Repeat, CalendarDays, LayoutGrid } from "lucide-react";
import { useScheduled, useScheduleTraining, useDeleteScheduled, ScheduledTraining } from "@/hooks/useScheduled";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { useSessionStore } from "@/store/sessionStore";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type ViewMode = "month" | "week";

export function Calendar() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(new Date());
  const [pickDate, setPickDate] = useState<Date | null>(null);

  const { data: scheduled = [] } = useScheduled();
  const { data: sessions = [] } = useTrainingSessions();
  const schedule = useScheduleTraining();
  const delSchedule = useDeleteScheduled();
  const { startMatchday } = useSessionStore();

  const days = viewMode === "month"
    ? eachDayOfInterval({
        start: startOfWeek(startOfMonth(cursor)),
        end: endOfWeek(endOfMonth(cursor)),
      })
    : eachDayOfInterval({ start: startOfWeek(cursor), end: endOfWeek(cursor) });

  const getDayItems = (day: Date): (ScheduledTraining & { effectiveDate: string })[] => {
    return scheduled.flatMap((s) => {
      const d = parseISO(s.scheduled_date);
      if (isSameDay(d, day)) return [{ ...s, effectiveDate: s.scheduled_date }];
      if (s.repeat_weekly && d <= day && d.getDay() === day.getDay()) {
        return [{ ...s, effectiveDate: format(day, "yyyy-MM-dd") }];
      }
      return [];
    });
  };

  const sessionById = Object.fromEntries(sessions.map((s) => [s.id, s]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(viewMode === "month" ? subMonths(cursor, 1) : subWeeks(cursor, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-semibold text-foreground tracking-tight min-w-[180px] text-center">
            {viewMode === "month"
              ? format(cursor, "MMMM yyyy")
              : `${format(startOfWeek(cursor), "MMM d")} – ${format(endOfWeek(cursor), "MMM d, yyyy")}`}
          </h2>
          <button
            onClick={() => setCursor(viewMode === "month" ? addMonths(cursor, 1) : addWeeks(cursor, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="text-xs px-2 py-1 rounded-sm hover:bg-muted text-muted-foreground"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-sm p-0.5">
          <button
            onClick={() => setViewMode("month")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-sm transition-all ${viewMode === "month" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            <LayoutGrid className="w-3 h-3" /> Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-sm transition-all ${viewMode === "week" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            <CalendarDays className="w-3 h-3" /> Week
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden border border-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-background p-2 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const items = getDayItems(day);
          const isCurrentMonth = viewMode === "week" || isSameMonth(day, cursor);
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={`bg-background ${viewMode === "week" ? "min-h-[180px]" : "min-h-[90px]"} p-1.5 group relative ${!isCurrentMonth ? "opacity-40" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono tabular-nums ${isToday ? "bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center" : "text-muted-foreground"}`}>
                  {format(day, "d")}
                </span>
                <button
                  onClick={() => setPickDate(day)}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-sm hover:bg-muted transition-all"
                  title="Schedule training"
                >
                  <Plus className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
              <div className="mt-1 space-y-1">
                {items.map((item, i) => {
                  const sess = item.session_id ? sessionById[item.session_id] : null;
                  return (
                    <div
                      key={item.id + i}
                      onClick={() => sess && startMatchday(sess)}
                      className="text-[10px] bg-primary/10 text-primary rounded-sm px-1.5 py-1 cursor-pointer hover:bg-primary/20 transition-colors flex items-center justify-between gap-1"
                    >
                      <span className="truncate flex items-center gap-1">
                        {item.repeat_weekly && <Repeat className="w-2.5 h-2.5 flex-shrink-0" />}
                        {sess?.name ?? "Session removed"}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); delSchedule.mutate(item.id); }}
                        className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {pickDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={() => setPickDate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background rounded-lg shadow-xl max-w-md w-full p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Schedule for {format(pickDate, "MMM d, yyyy")}
                </h3>
                <button onClick={() => setPickDate(null)} className="w-7 h-7 rounded-sm hover:bg-muted flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No saved sessions to schedule.</p>
              ) : (
                <SchedulePicker
                  date={pickDate}
                  sessions={sessions}
                  onSchedule={async (session_id, repeat_weekly) => {
                    try {
                      await schedule.mutateAsync({
                        session_id,
                        scheduled_date: format(pickDate, "yyyy-MM-dd"),
                        repeat_weekly,
                      });
                      toast.success("Training scheduled");
                      setPickDate(null);
                    } catch (e: any) {
                      toast.error(e.message ?? "Failed");
                    }
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SchedulePicker({ date, sessions, onSchedule }: { date: Date; sessions: any[]; onSchedule: (id: string, repeat: boolean) => void }) {
  const [selected, setSelected] = useState<string>("");
  const [repeat, setRepeat] = useState(false);
  return (
    <div className="space-y-3">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="">Pick a session...</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>{s.name} ({s.total_duration}m)</option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} className="rounded" />
        <Repeat className="w-3.5 h-3.5" /> Repeat weekly
      </label>
      <button
        onClick={() => selected && onSchedule(selected, repeat)}
        disabled={!selected}
        className="w-full px-4 py-2 rounded-sm bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40"
      >
        Schedule
      </button>
    </div>
  );
}