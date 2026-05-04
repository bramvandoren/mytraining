import { create } from 'zustand';
import { Exercise, SessionExercise, TrainingSession, AgeGroup } from '@/data/exercises';

interface SessionStore {
  // Current session being built
  currentExercises: SessionExercise[];
  sessionName: string;
  sessionDate: string;
  sessionAgeGroup: AgeGroup;
  editingSessionId: string | null;

  // Matchday mode
  activeSession: TrainingSession | null;
  activeExerciseIndex: number;

  // Actions
  addExercise: (exercise: Exercise) => void;
  removeExercise: (id: string) => void;
  reorderExercises: (from: number, to: number) => void;
  updateNotes: (id: string, notes: string) => void;
  setSessionName: (name: string) => void;
  setSessionDate: (date: string) => void;
  setSessionAgeGroup: (ag: AgeGroup) => void;
  loadSession: (session: TrainingSession & { id?: string }) => void;
  loadFromTemplate: (exercises: SessionExercise[], name?: string) => void;
  startMatchday: (session: TrainingSession) => void;
  stopMatchday: () => void;
  setActiveExerciseIndex: (i: number) => void;
  clearCurrentSession: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  currentExercises: [],
  sessionName: '',
  sessionDate: new Date().toISOString().split('T')[0],
  sessionAgeGroup: 'U12',
  editingSessionId: null,
  activeSession: null,
  activeExerciseIndex: 0,

  addExercise: (exercise) => set((s) => ({
    currentExercises: [
      ...s.currentExercises,
      {
        id: `se-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        exercise,
        notes: '',
        order: s.currentExercises.length,
      },
    ],
  })),

  removeExercise: (id) => set((s) => ({
    currentExercises: s.currentExercises
      .filter((e) => e.id !== id)
      .map((e, i) => ({ ...e, order: i })),
  })),

  reorderExercises: (from, to) => set((s) => {
    const list = [...s.currentExercises];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    return { currentExercises: list.map((e, i) => ({ ...e, order: i })) };
  }),

  updateNotes: (id, notes) => set((s) => ({
    currentExercises: s.currentExercises.map((e) =>
      e.id === id ? { ...e, notes } : e
    ),
  })),

  setSessionName: (name) => set({ sessionName: name }),
  setSessionDate: (date) => set({ sessionDate: date }),
  setSessionAgeGroup: (ag) => set({ sessionAgeGroup: ag }),

  loadSession: (session) => set({
    currentExercises: session.exercises.map((e, i) => ({ ...e, order: i })),
    sessionName: session.name,
    sessionDate: session.date,
    sessionAgeGroup: session.ageGroup,
    editingSessionId: session.id ?? null,
  }),

  loadFromTemplate: (exercises, name) => set({
    currentExercises: exercises.map((e, i) => ({
      ...e,
      id: `se-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      order: i,
    })),
    sessionName: name ?? '',
    editingSessionId: null,
  }),

  startMatchday: (session) => set({
    activeSession: session,
    activeExerciseIndex: 0,
  }),

  stopMatchday: () => set({
    activeSession: null,
    activeExerciseIndex: 0,
  }),

  setActiveExerciseIndex: (i) => set({ activeExerciseIndex: i }),

  clearCurrentSession: () => set({
    currentExercises: [],
    sessionName: '',
    sessionDate: new Date().toISOString().split('T')[0],
    sessionAgeGroup: 'U12',
    editingSessionId: null,
  }),
}));
