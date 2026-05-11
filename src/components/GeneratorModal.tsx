import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { X, Sparkles, RefreshCw, Plus } from "lucide-react";
import { exercises as predefined, AgeGroup, Exercise } from "@/data/exercises";
import { useCustomExercises } from "@/hooks/useCustomExercises";
import { useExerciseTagMap, useTags } from "@/hooks/useTags";
import { useSessionStore } from "@/store/sessionStore";
import { toast } from "sonner";

const ageGroups: AgeGroup[] = ["U6", "U8", "U10", "U12", "U14", "U16", "U18", "Senior"];

interface Props {
  onClose: () => void;
}

function pickToFitDuration(pool: Exercise[], target: number): Exercise[] {
  // Greedy + variation: keep adding until close to target, alternate types
  const result: Exercise[] = [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  let total = 0;
  const usedTypes: Record<string, number> = {};
  // ensure warm-up first
  const warm = shuffled.find((e) => e.type === "warm-up");
  if (warm) {
    result.push(warm);
    total += warm.duration;
    usedTypes[warm.type] = 1;
  }
  for (const ex of shuffled) {
    if (total >= target) break;
    if (result.includes(ex)) continue;
    if (total + ex.duration > target + 5) continue;
    // soft variation: don't allow more than 2 of same type
    if ((usedTypes[ex.type] ?? 0) >= 2) continue;
    result.push(ex);
    total += ex.duration;
    usedTypes[ex.type] = (usedTypes[ex.type] ?? 0) + 1;
  }
  // append cool-down if room
  const cool = shuffled.find((e) => e.type === "cool-down" && !result.includes(e));
  if (cool && total + cool.duration <= target + 5) {
    result.push(cool);
  }
  return result;
}

export function GeneratorModal({ onClose }: Props) {
  const [age, setAge] = useState<AgeGroup>("U12");
  const [duration, setDuration] = useState(60);
  const [focusTagIds, setFocusTagIds] = useState<string[]>([]);
  const [generated, setGenerated] = useState<Exercise[] | null>(null);

  const { data: custom = [] } = useCustomExercises();
  const { data: tags = [] } = useTags();
  const { data: tagMap = {} } = useExerciseTagMap();
  const { addExercise } = useSessionStore();

  const allExercises = useMemo<Exercise[]>(() => [...custom, ...predefined], [custom]);

  const generate = () => {
    const pool = allExercises.filter((ex) => {
      if (!ex.ageGroups.includes(age)) return false;
      if (focusTagIds.length === 0) return true;
      const customAny: any = ex;
      if (customAny.customId) {
        const exTags = tagMap[customAny.customId] ?? [];
        if (exTags.some((t) => focusTagIds.includes(t))) return true;
      }
      // legacy fallback: type matches a focus tag slug
      const focusSlugs = tags.filter((t) => focusTagIds.includes(t.id)).map((t) => t.slug);
      if (focusSlugs.includes(ex.type)) return true;
      return false;
    });
    if (pool.length < 2) {
      toast.error("Not enough matching exercises. Try fewer filters.");
      return;
    }
    setGenerated(pickToFitDuration(pool, duration));
  };

  const totalDuration = generated?.reduce((s, e) => s + e.duration, 0) ?? 0;

  const useIt = () => {
    if (!generated) return;
    generated.forEach(addExercise);
    toast.success(`Added ${generated.length} exercises to builder`);
    onClose();
  };

  const toggleFocus = (id: string) =>
    setFocusTagIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Smart Training Generator
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-sm hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1.5">Age group</label>
              <select value={age} onChange={(e) => setAge(e.target.value as AgeGroup)}
                className="w-full px-3 py-2 text-sm bg-muted rounded-md outline-none">
                {ageGroups.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5">Total duration (min)</label>
              <input type="number" min={20} max={180} value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-muted rounded-md outline-none font-mono" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5">Focus tags (optional)</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button key={t.id} onClick={() => toggleFocus(t.id)}
                  className={`text-xs px-2.5 py-1.5 rounded-sm transition-all ${
                    focusTagIds.includes(t.id) ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <button onClick={generate} className="w-full px-4 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> Generate Training
          </button>

          {generated && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-mono">
                  {generated.length} drills · {totalDuration}m total
                </p>
                <button onClick={generate} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {generated.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-sm p-2 text-sm">
                    <span className="text-lg">{ex.icon}</span>
                    <span className="flex-1 truncate">{ex.title}</span>
                    <span className="text-xs font-mono text-muted-foreground">{ex.duration}m</span>
                  </div>
                ))}
              </div>
              <button onClick={useIt} className="w-full px-4 py-2 rounded-sm bg-foreground text-background text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add all to Session Builder
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
