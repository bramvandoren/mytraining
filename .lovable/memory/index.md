Lovable Cloud backend setup, 2D field editor, custom exercises, media uploads, exercise detail modal, auth system.

Design system: Geist Sans/Mono fonts, Pitch Green (#22c55e-ish HSL 142 71% 45%) as primary accent, white surfaces, shadow-card/shadow-card-hover utilities, 12/8/6px radii.
State: Zustand store for session management, localStorage persistence.
Stack: React + Vite + Tailwind + framer-motion + zustand + Lovable Cloud.
Database: custom_exercises table (user_id FK, user-scoped RLS). profiles table (auto-created on signup). exercise-media storage bucket.
Auth: Email/password signup+login, password reset flow, protected routes. Email confirmation required.
Field Editor: SVG-based with drag-drop elements (players, cones, arrows, zones, goals, balls).
Custom exercises appear alongside predefined ones in the library, showing creator name.
