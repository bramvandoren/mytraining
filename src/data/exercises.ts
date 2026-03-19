export type AgeGroup = "U6" | "U8" | "U10" | "U12" | "U14" | "U16" | "U18" | "Senior";
export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type ExerciseType = "warm-up" | "technique" | "passing" | "finishing" | "game-form" | "fitness" | "cool-down";
export type FieldSize = "small" | "medium" | "large" | "full";

export interface Exercise {
  id: string;
  title: string;
  description: string;
  players: number;
  duration: number; // minutes
  ageGroups: AgeGroup[];
  skillLevel: SkillLevel;
  type: ExerciseType;
  fieldSize: FieldSize;
  icon: string; // emoji for visual
}

export interface SessionExercise {
  id: string;
  exercise: Exercise;
  notes: string;
  order: number;
}

export interface TrainingSession {
  id: string;
  name: string;
  date: string;
  ageGroup: AgeGroup;
  exercises: SessionExercise[];
  createdAt: string;
}

export const exercises: Exercise[] = [
  {
    id: "ex-1",
    title: "Rondo 4v2",
    description: "Four attackers try to keep possession against two defenders in a small square. Focus on quick one-touch passing, body positioning, and support angles.",
    players: 6,
    duration: 10,
    ageGroups: ["U12", "U14", "U16", "U18", "Senior"],
    skillLevel: "intermediate",
    type: "passing",
    fieldSize: "small",
    icon: "🔄",
  },
  {
    id: "ex-2",
    title: "Dynamic Warm-Up Circuit",
    description: "Players move through a series of dynamic stretches and light agility exercises: high knees, butt kicks, lateral shuffles, and arm circles.",
    players: 16,
    duration: 10,
    ageGroups: ["U8", "U10", "U12", "U14", "U16", "U18", "Senior"],
    skillLevel: "beginner",
    type: "warm-up",
    fieldSize: "medium",
    icon: "🏃",
  },
  {
    id: "ex-3",
    title: "1v1 Finishing Drill",
    description: "Attacker receives a pass and tries to score past a defender and goalkeeper. Focus on first touch, change of direction, and clinical finishing.",
    players: 4,
    duration: 15,
    ageGroups: ["U12", "U14", "U16", "U18", "Senior"],
    skillLevel: "intermediate",
    type: "finishing",
    fieldSize: "medium",
    icon: "⚽",
  },
  {
    id: "ex-4",
    title: "Dribbling Gates",
    description: "Set up small gates (cones) around the area. Players dribble through as many gates as possible in a set time. Focus on close control and awareness.",
    players: 12,
    duration: 10,
    ageGroups: ["U6", "U8", "U10", "U12"],
    skillLevel: "beginner",
    type: "technique",
    fieldSize: "medium",
    icon: "🎯",
  },
  {
    id: "ex-5",
    title: "Small-Sided Game 5v5",
    description: "Two teams play in a reduced space with small goals. Encourages quick decision-making, transitions, and positional awareness.",
    players: 10,
    duration: 20,
    ageGroups: ["U10", "U12", "U14", "U16", "U18", "Senior"],
    skillLevel: "intermediate",
    type: "game-form",
    fieldSize: "medium",
    icon: "🏟️",
  },
  {
    id: "ex-6",
    title: "Passing Triangles",
    description: "Three players form a triangle and pass the ball with movement. After each pass, the passer moves to an open cone. Focus on weight of pass and timing of runs.",
    players: 6,
    duration: 10,
    ageGroups: ["U10", "U12", "U14", "U16"],
    skillLevel: "beginner",
    type: "passing",
    fieldSize: "small",
    icon: "📐",
  },
  {
    id: "ex-7",
    title: "Crossing & Finishing",
    description: "Wide players deliver crosses from both flanks. Strikers attack the near post, far post, and penalty spot. Rotate positions every 5 minutes.",
    players: 8,
    duration: 15,
    ageGroups: ["U14", "U16", "U18", "Senior"],
    skillLevel: "advanced",
    type: "finishing",
    fieldSize: "large",
    icon: "🥅",
  },
  {
    id: "ex-8",
    title: "Ball Mastery Footwork",
    description: "Individual ball mastery exercises: toe taps, rolls, pull-backs, Cruyff turns. Each player with a ball. Follow the coach's commands.",
    players: 16,
    duration: 10,
    ageGroups: ["U6", "U8", "U10", "U12"],
    skillLevel: "beginner",
    type: "technique",
    fieldSize: "small",
    icon: "👟",
  },
  {
    id: "ex-9",
    title: "Positional Play 8v4",
    description: "Eight attackers maintain possession against four defenders in a large grid. Focus on switching play, third-man runs, and creating passing lanes.",
    players: 12,
    duration: 15,
    ageGroups: ["U16", "U18", "Senior"],
    skillLevel: "advanced",
    type: "passing",
    fieldSize: "large",
    icon: "♟️",
  },
  {
    id: "ex-10",
    title: "Sprint & Recovery Intervals",
    description: "Players sprint 30m, jog back, sprint again. 6 repetitions with 45 seconds rest between sets. Focus on acceleration and deceleration.",
    players: 16,
    duration: 10,
    ageGroups: ["U14", "U16", "U18", "Senior"],
    skillLevel: "intermediate",
    type: "fitness",
    fieldSize: "large",
    icon: "⚡",
  },
  {
    id: "ex-11",
    title: "Goalkeeper Distribution",
    description: "GK practices short and long distribution to targets. Includes goal kicks, throws, and rolling passes under pressure from a closing attacker.",
    players: 4,
    duration: 15,
    ageGroups: ["U12", "U14", "U16", "U18", "Senior"],
    skillLevel: "intermediate",
    type: "technique",
    fieldSize: "large",
    icon: "🧤",
  },
  {
    id: "ex-12",
    title: "Cool-Down & Stretching",
    description: "Light jogging followed by a full-body static stretch routine. Hold each stretch for 20-30 seconds. Focus on hamstrings, quads, and hip flexors.",
    players: 16,
    duration: 10,
    ageGroups: ["U8", "U10", "U12", "U14", "U16", "U18", "Senior"],
    skillLevel: "beginner",
    type: "cool-down",
    fieldSize: "small",
    icon: "🧘",
  },
  {
    id: "ex-13",
    title: "3v3 Tournament",
    description: "Multiple teams compete in a round-robin tournament on small pitches. Quick games of 3 minutes each. Winning team stays on.",
    players: 12,
    duration: 20,
    ageGroups: ["U8", "U10", "U12", "U14"],
    skillLevel: "beginner",
    type: "game-form",
    fieldSize: "small",
    icon: "🏆",
  },
  {
    id: "ex-14",
    title: "Shadow Play Build-Up",
    description: "Full team practices build-up patterns without opposition. GK to CB to FB overlap to winger. Rehearse set movements and triggers.",
    players: 11,
    duration: 15,
    ageGroups: ["U16", "U18", "Senior"],
    skillLevel: "advanced",
    type: "passing",
    fieldSize: "full",
    icon: "📋",
  },
  {
    id: "ex-15",
    title: "Fun Tag Games",
    description: "Various tag games to develop agility and spatial awareness. Includes freeze tag, chain tag, and ball tag variations.",
    players: 16,
    duration: 10,
    ageGroups: ["U6", "U8", "U10"],
    skillLevel: "beginner",
    type: "warm-up",
    fieldSize: "medium",
    icon: "🎪",
  },
];
