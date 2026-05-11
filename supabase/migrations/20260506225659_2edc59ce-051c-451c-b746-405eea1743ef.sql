
-- =========================================
-- 1. ROLES ENUM + helpers
-- =========================================
CREATE TYPE public.club_role AS ENUM ('admin', 'coach');

-- =========================================
-- 2. CLUBS + MEMBERSHIP
-- =========================================
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  is_personal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.club_members (
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.club_role NOT NULL DEFAULT 'coach',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, user_id)
);
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- security-definer helpers (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_club_member(_club_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.club_members WHERE club_id=_club_id AND user_id=_user_id) $$;

CREATE OR REPLACE FUNCTION public.has_club_role(_club_id UUID, _user_id UUID, _role public.club_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.club_members WHERE club_id=_club_id AND user_id=_user_id AND role=_role) $$;

CREATE OR REPLACE FUNCTION public.user_club_ids(_user_id UUID)
RETURNS SETOF UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT club_id FROM public.club_members WHERE user_id=_user_id $$;

-- RLS clubs
CREATE POLICY "Members can view clubs" ON public.clubs FOR SELECT TO authenticated
  USING (public.is_club_member(id, auth.uid()));
CREATE POLICY "Authed can create clubs" ON public.clubs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update clubs" ON public.clubs FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);
CREATE POLICY "Owners delete clubs" ON public.clubs FOR DELETE TO authenticated
  USING (auth.uid() = owner_id AND NOT is_personal);

-- RLS club_members
CREATE POLICY "Members view memberships" ON public.club_members FOR SELECT TO authenticated
  USING (public.is_club_member(club_id, auth.uid()));
CREATE POLICY "Admins add members" ON public.club_members FOR INSERT TO authenticated
  WITH CHECK (public.has_club_role(club_id, auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "Admins update roles" ON public.club_members FOR UPDATE TO authenticated
  USING (public.has_club_role(club_id, auth.uid(), 'admin'));
CREATE POLICY "Admins remove members" ON public.club_members FOR DELETE TO authenticated
  USING (public.has_club_role(club_id, auth.uid(), 'admin') OR auth.uid() = user_id);

-- =========================================
-- 3. TAGS
-- =========================================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Authed can create tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (true);

INSERT INTO public.tags (slug, name) VALUES
  ('passing','Passing'),('finishing','Finishing'),('technique','Technique'),
  ('possession','Possession'),('pressing','Pressing'),('1v1','1v1'),
  ('warm-up','Warm-up'),('cool-down','Cool-down'),('fitness','Fitness'),
  ('game-form','Game Form'),('dribbling','Dribbling'),('crossing','Crossing'),
  ('defending','Defending'),('build-up','Build-up'),('transition','Transition');

CREATE TABLE public.exercise_tags (
  exercise_id UUID NOT NULL REFERENCES public.custom_exercises(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (exercise_id, tag_id)
);
ALTER TABLE public.exercise_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view exercise tags" ON public.exercise_tags FOR SELECT USING (true);
CREATE POLICY "Owners can add tags" ON public.exercise_tags FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.custom_exercises e WHERE e.id=exercise_id AND e.user_id=auth.uid()));
CREATE POLICY "Owners can remove tags" ON public.exercise_tags FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.custom_exercises e WHERE e.id=exercise_id AND e.user_id=auth.uid()));

-- =========================================
-- 4. EXERCISE LIKES (marketplace)
-- =========================================
CREATE TABLE public.exercise_likes (
  user_id UUID NOT NULL,
  exercise_id UUID NOT NULL REFERENCES public.custom_exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, exercise_id)
);
ALTER TABLE public.exercise_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authed views likes" ON public.exercise_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users like" ON public.exercise_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike" ON public.exercise_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================
-- 5. EXTEND EXISTING TABLES
-- =========================================
ALTER TABLE public.custom_exercises 
  ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.training_sessions 
  ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  ADD COLUMN share_token TEXT UNIQUE,
  ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.training_templates 
  ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL;

-- =========================================
-- 6. SEASONS / WEEKLY PLANS
-- =========================================
CREATE TABLE public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or club seasons" ON public.seasons FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (club_id IS NOT NULL AND public.is_club_member(club_id, auth.uid())));
CREATE POLICY "Insert own seasons" ON public.seasons FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own seasons" ON public.seasons FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Delete own seasons" ON public.seasons FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  goals TEXT,
  session_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season_id, week_start)
);
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View weekly plans of accessible season" ON public.weekly_plans FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seasons s WHERE s.id = season_id AND (s.user_id = auth.uid() OR (s.club_id IS NOT NULL AND public.is_club_member(s.club_id, auth.uid())))));
CREATE POLICY "Insert weekly plans of own season" ON public.weekly_plans FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.seasons s WHERE s.id = season_id AND s.user_id = auth.uid()));
CREATE POLICY "Update weekly plans of own season" ON public.weekly_plans FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seasons s WHERE s.id = season_id AND s.user_id = auth.uid()));
CREATE POLICY "Delete weekly plans of own season" ON public.weekly_plans FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.seasons s WHERE s.id = season_id AND s.user_id = auth.uid()));

-- =========================================
-- 7. UPDATE RLS for exercises / sessions / templates with club + public
-- =========================================
DROP POLICY IF EXISTS "Anyone can view exercises" ON public.custom_exercises;
CREATE POLICY "Visible exercises" ON public.custom_exercises FOR SELECT
  USING (
    is_predefined = true
    OR is_public = true
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (club_id IS NOT NULL AND auth.uid() IS NOT NULL AND public.is_club_member(club_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Anyone authed can view sessions" ON public.training_sessions;
CREATE POLICY "Visible sessions" ON public.training_sessions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (club_id IS NOT NULL AND public.is_club_member(club_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Anyone authed can view templates" ON public.training_templates;
CREATE POLICY "Visible templates" ON public.training_templates FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (club_id IS NOT NULL AND public.is_club_member(club_id, auth.uid()))
  );

-- =========================================
-- 8. PUBLIC SHARE: SECURITY DEFINER getter for shared sessions
-- =========================================
CREATE OR REPLACE FUNCTION public.get_shared_session(_token TEXT)
RETURNS TABLE (
  id UUID, name TEXT, date DATE, age_group TEXT,
  exercises JSONB, total_duration INTEGER, created_at TIMESTAMPTZ
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, name, date, age_group, exercises, total_duration, created_at
  FROM public.training_sessions
  WHERE share_token = _token AND is_shared = true
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_shared_session(TEXT) TO anon, authenticated;

-- =========================================
-- 9. AUTO PERSONAL CLUB on signup + backfill
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_club_id UUID;
  display TEXT;
BEGIN
  display := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, display);
  INSERT INTO public.clubs (name, owner_id, is_personal)
    VALUES (display || '''s Club', NEW.id, true)
    RETURNING id INTO new_club_id;
  INSERT INTO public.club_members (club_id, user_id, role) VALUES (new_club_id, NEW.id, 'admin');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create personal club for each existing user that doesn't have one
DO $$
DECLARE
  u RECORD;
  new_club UUID;
BEGIN
  FOR u IN
    SELECT p.id, p.display_name
    FROM public.profiles p
    WHERE NOT EXISTS (SELECT 1 FROM public.clubs c WHERE c.owner_id = p.id AND c.is_personal = true)
  LOOP
    INSERT INTO public.clubs (name, owner_id, is_personal)
      VALUES (COALESCE(NULLIF(u.display_name,''),'Coach') || '''s Club', u.id, true)
      RETURNING id INTO new_club;
    INSERT INTO public.club_members (club_id, user_id, role) VALUES (new_club, u.id, 'admin')
      ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- =========================================
-- 10. updated_at triggers for new tables
-- =========================================
-- (none of the new tables expose updated_at except via existing function patterns; skip)
