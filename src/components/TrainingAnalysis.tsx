import { SessionExercise } from "@/data/exercises";
import { useMemo } from "react";

const colors = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-red-500",
  "bg-purple-500", "bg-orange-500", "bg-sky-500", "bg-pink-500",
];

export function TrainingAnalysis({ exercises }: { exercises: SessionExercise[] }) {
  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    let total = 0;
    for (const e of exercises) {
      const t = e.exercise.type;
      totals[t] = (totals[t] ?? 0) + e.exercise.duration;
      total += e.exercise.duration;
    }
    return Object.entries(totals)
      .map(([type, mins]) => ({ type, mins, pct: total ? Math.round((mins / total) * 100) : 0 }))
      .sort((a, b) => b.mins - a.mins);
  }, [exercises]);

  if (data.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 h-2 rounded-full overflow-hidden bg-muted">
        {data.map((d, i) => (
          <div key={d.type} className={`${colors[i % colors.length]} h-full`} style={{ width: `${d.pct}%` }} title={`${d.type}: ${d.mins}m`} />
        ))}
      </div>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={d.type} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-sm ${colors[i % colors.length]}`} />
              <span className="capitalize text-foreground">{d.type}</span>
            </div>
            <span className="font-mono text-muted-foreground tabular-nums">{d.mins}m · {d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
