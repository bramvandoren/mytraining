import { AgeGroup, ExerciseType, SkillLevel } from "@/data/exercises";
import { Search, X } from "lucide-react";

interface FiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  ageGroup: AgeGroup | "";
  onAgeGroupChange: (v: AgeGroup | "") => void;
  type: ExerciseType | "";
  onTypeChange: (v: ExerciseType | "") => void;
  skillLevel: SkillLevel | "";
  onSkillLevelChange: (v: SkillLevel | "") => void;
}

const ageGroups: AgeGroup[] = ["U6", "U8", "U10", "U12", "U14", "U16", "U18", "Senior"];
const types: ExerciseType[] = ["warm-up", "technique", "passing", "finishing", "game-form", "fitness", "cool-down"];
const skills: SkillLevel[] = ["beginner", "intermediate", "advanced"];

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-2.5 py-1.5 rounded-sm transition-all duration-150 whitespace-nowrap ${
        active
          ? "bg-foreground text-background"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export function ExerciseFilters({
  search, onSearchChange,
  ageGroup, onAgeGroupChange,
  type, onTypeChange,
  skillLevel, onSkillLevelChange,
}: FiltersProps) {
  const hasFilters = ageGroup || type || skillLevel;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search exercises..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted rounded-md border-0 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground transition-all"
        />
        {search && (
          <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {ageGroups.map((ag) => (
            <FilterPill
              key={ag}
              label={ag}
              active={ageGroup === ag}
              onClick={() => onAgeGroupChange(ageGroup === ag ? "" : ag)}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {types.map((t) => (
            <FilterPill
              key={t}
              label={t}
              active={type === t}
              onClick={() => onTypeChange(type === t ? "" : t)}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <FilterPill
              key={s}
              label={s}
              active={skillLevel === s}
              onClick={() => onSkillLevelChange(skillLevel === s ? "" : s)}
            />
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={() => {
            onAgeGroupChange("");
            onTypeChange("");
            onSkillLevelChange("");
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
