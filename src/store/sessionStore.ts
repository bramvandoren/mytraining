import { create } from 'zustand';
import { Exercise, SessionExercise, TrainingSession, AgeGroup } from '@/data/exercises';

interface SessionStore {
  // Current session being built
  currentExercises: SessionExercise[];
  sessionName: string;
  sessionDate: string;
  sessionAgeGroup: AgeGroup;
  
  // Saved sessions
  savedSessions: TrainingSession[];
  
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
  saveSession: () => void;
  deleteSession: (id: string) => void;
  loadSession: (session: TrainingSession) => void;
  startMatchday: (session: TrainingSession) => void;
  stopMatchday: () => void;
  setActiveExerciseIndex: (i: number) => void;
  clearCurrentSession: () => void;
}

const loadSessions = (): TrainingSession[] => {
  try {
    const data = localStorage.getItem('training-sessions');
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveSessions = (sessions: TrainingSession[]) => {
  localStorage.setItem('training-sessions', JSON.stringify(sessions));
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  currentExercises: [],
  sessionName: '',
  sessionDate: new Date().toISOString().split('T')[0],
  sessionAgeGroup: 'U12',
  savedSessions: loadSessions(),
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

  saveSession: () => {
    const s = get();
    if (!s.sessionName.trim() || s.currentExercises.length === 0) return;
    const session: TrainingSession = {
      id: `ts-${Date.now()}`,
      name: s.sessionName,
      date: s.sessionDate,
      ageGroup: s.sessionAgeGroup,
      exercises: s.currentExercises,
      createdAt: new Date().toISOString(),
    };
    const updated = [session, ...s.savedSessions];
    saveSessions(updated);
    set({
      savedSessions: updated,
      currentExercises: [],
      sessionName: '',
    });
  },

  deleteSession: (id) => set((s) => {
    const updated = s.savedSessions.filter((ss) => ss.id !== id);
    saveSessions(updated);
    return { savedSessions: updated };
  }),

  loadSession: (session) => set({
    currentExercises: session.exercises,
    sessionName: session.name,
    sessionDate: session.date,
    sessionAgeGroup: session.ageGroup,
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
  }),
}));
