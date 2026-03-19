
-- Create custom exercises table
CREATE TABLE public.custom_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  players INTEGER NOT NULL DEFAULT 6,
  duration INTEGER NOT NULL DEFAULT 10,
  age_groups TEXT[] NOT NULL DEFAULT '{}',
  skill_level TEXT NOT NULL DEFAULT 'beginner',
  exercise_type TEXT NOT NULL DEFAULT 'technique',
  field_size TEXT NOT NULL DEFAULT 'medium',
  icon TEXT NOT NULL DEFAULT '⚽',
  field_diagram JSONB DEFAULT NULL,
  preview_image_url TEXT DEFAULT NULL,
  video_url TEXT DEFAULT NULL,
  is_predefined BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth required for now)
CREATE POLICY "Anyone can view exercises"
  ON public.custom_exercises FOR SELECT USING (true);

CREATE POLICY "Anyone can create exercises"
  ON public.custom_exercises FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update exercises"
  ON public.custom_exercises FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete exercises"
  ON public.custom_exercises FOR DELETE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_custom_exercises_updated_at
  BEFORE UPDATE ON public.custom_exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for exercise media
INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-media', 'exercise-media', true);

CREATE POLICY "Anyone can view exercise media"
  ON storage.objects FOR SELECT USING (bucket_id = 'exercise-media');

CREATE POLICY "Anyone can upload exercise media"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exercise-media');

CREATE POLICY "Anyone can update exercise media"
  ON storage.objects FOR UPDATE USING (bucket_id = 'exercise-media');

CREATE POLICY "Anyone can delete exercise media"
  ON storage.objects FOR DELETE USING (bucket_id = 'exercise-media');
