
-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add user_id to custom_exercises
ALTER TABLE public.custom_exercises ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies on custom_exercises to be user-scoped
DROP POLICY IF EXISTS "Anyone can create exercises" ON public.custom_exercises;
DROP POLICY IF EXISTS "Anyone can delete exercises" ON public.custom_exercises;
DROP POLICY IF EXISTS "Anyone can update exercises" ON public.custom_exercises;
DROP POLICY IF EXISTS "Anyone can view exercises" ON public.custom_exercises;

CREATE POLICY "Anyone can view exercises" ON public.custom_exercises
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create exercises" ON public.custom_exercises
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises" ON public.custom_exercises
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercises" ON public.custom_exercises
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
