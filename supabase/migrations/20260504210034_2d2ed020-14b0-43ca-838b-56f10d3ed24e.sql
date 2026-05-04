
-- FAVORITES
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exercise_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own favorites" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own favorites" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- TRAINING SESSIONS
CREATE TABLE public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  age_group TEXT NOT NULL DEFAULT 'U12',
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed can view sessions" ON public.training_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own sessions" ON public.training_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.training_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.training_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER training_sessions_updated_at BEFORE UPDATE ON public.training_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TRAINING TEMPLATES
CREATE TABLE public.training_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.training_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed can view templates" ON public.training_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own templates" ON public.training_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own templates" ON public.training_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own templates" ON public.training_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER training_templates_updated_at BEFORE UPDATE ON public.training_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SCHEDULED TRAININGS (calendar)
CREATE TABLE public.scheduled_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  repeat_weekly BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scheduled_trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own scheduled" ON public.scheduled_trainings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own scheduled" ON public.scheduled_trainings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own scheduled" ON public.scheduled_trainings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own scheduled" ON public.scheduled_trainings FOR DELETE TO authenticated USING (auth.uid() = user_id);
