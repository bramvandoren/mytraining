-- ============================================================
-- Hardening migration: indexes, FKs, soft-delete, cascades,
-- updated_at triggers, share_token uniqueness, storage limits.
-- ============================================================

-- 1) Foreign keys (where missing) with cascade rules
ALTER TABLE public.club_members
  DROP CONSTRAINT IF EXISTS club_members_club_id_fkey,
  ADD CONSTRAINT club_members_club_id_fkey
    FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;

ALTER TABLE public.club_members
  DROP CONSTRAINT IF EXISTS club_members_user_id_fkey,
  ADD CONSTRAINT club_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.club_members
  DROP CONSTRAINT IF EXISTS club_members_pkey;
ALTER TABLE public.club_members
  ADD CONSTRAINT club_members_pkey PRIMARY KEY (club_id, user_id);

ALTER TABLE public.exercise_likes
  DROP CONSTRAINT IF EXISTS exercise_likes_exercise_id_fkey,
  ADD CONSTRAINT exercise_likes_exercise_id_fkey
    FOREIGN KEY (exercise_id) REFERENCES public.custom_exercises(id) ON DELETE CASCADE;

ALTER TABLE public.exercise_likes
  DROP CONSTRAINT IF EXISTS exercise_likes_pkey;
ALTER TABLE public.exercise_likes
  ADD CONSTRAINT exercise_likes_pkey PRIMARY KEY (exercise_id, user_id);

ALTER TABLE public.exercise_tags
  DROP CONSTRAINT IF EXISTS exercise_tags_exercise_id_fkey,
  ADD CONSTRAINT exercise_tags_exercise_id_fkey
    FOREIGN KEY (exercise_id) REFERENCES public.custom_exercises(id) ON DELETE CASCADE;

ALTER TABLE public.exercise_tags
  DROP CONSTRAINT IF EXISTS exercise_tags_tag_id_fkey,
  ADD CONSTRAINT exercise_tags_tag_id_fkey
    FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;

ALTER TABLE public.exercise_tags
  DROP CONSTRAINT IF EXISTS exercise_tags_pkey;
ALTER TABLE public.exercise_tags
  ADD CONSTRAINT exercise_tags_pkey PRIMARY KEY (exercise_id, tag_id);

ALTER TABLE public.scheduled_trainings
  DROP CONSTRAINT IF EXISTS scheduled_trainings_session_id_fkey,
  ADD CONSTRAINT scheduled_trainings_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES public.training_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.weekly_plans
  DROP CONSTRAINT IF EXISTS weekly_plans_season_id_fkey,
  ADD CONSTRAINT weekly_plans_season_id_fkey
    FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE CASCADE;

ALTER TABLE public.custom_exercises
  DROP CONSTRAINT IF EXISTS custom_exercises_club_id_fkey,
  ADD CONSTRAINT custom_exercises_club_id_fkey
    FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE SET NULL;

ALTER TABLE public.training_sessions
  DROP CONSTRAINT IF EXISTS training_sessions_club_id_fkey,
  ADD CONSTRAINT training_sessions_club_id_fkey
    FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE SET NULL;

ALTER TABLE public.training_templates
  DROP CONSTRAINT IF EXISTS training_templates_club_id_fkey,
  ADD CONSTRAINT training_templates_club_id_fkey
    FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE SET NULL;

-- 2) Indexes for hot lookups
CREATE INDEX IF NOT EXISTS idx_custom_exercises_user        ON public.custom_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_exercises_club        ON public.custom_exercises(club_id);
CREATE INDEX IF NOT EXISTS idx_custom_exercises_public      ON public.custom_exercises(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_custom_exercises_created_at  ON public.custom_exercises(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_sessions_user       ON public.training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_club       ON public.training_sessions(club_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date       ON public.training_sessions(date);

CREATE INDEX IF NOT EXISTS idx_training_templates_user      ON public.training_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_training_templates_club      ON public.training_templates(club_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_user_date          ON public.scheduled_trainings(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_favorites_user               ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_seasons_user                 ON public.seasons(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_season          ON public.weekly_plans(season_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user            ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_tags_tag            ON public.exercise_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_exercise_likes_exercise      ON public.exercise_likes(exercise_id);

-- 3) Unique share token
CREATE UNIQUE INDEX IF NOT EXISTS uniq_training_sessions_share_token
  ON public.training_sessions(share_token) WHERE share_token IS NOT NULL;

-- 4) updated_at triggers (function already exists)
DROP TRIGGER IF EXISTS trg_custom_exercises_updated_at ON public.custom_exercises;
CREATE TRIGGER trg_custom_exercises_updated_at
  BEFORE UPDATE ON public.custom_exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_training_sessions_updated_at ON public.training_sessions;
CREATE TRIGGER trg_training_sessions_updated_at
  BEFORE UPDATE ON public.training_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_training_templates_updated_at ON public.training_templates;
CREATE TRIGGER trg_training_templates_updated_at
  BEFORE UPDATE ON public.training_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Storage hardening on the exercise-media bucket: type + size limits (10 MB)
UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'image/jpeg','image/png','image/webp','image/gif',
      'video/mp4','video/webm','video/quicktime'
    ]
WHERE id = 'exercise-media';

-- 6) Storage RLS: only authenticated users can write to exercise-media,
--    and writes/deletes require ownership of the first folder segment (user id or exercise id).
DROP POLICY IF EXISTS "exercise-media public read"   ON storage.objects;
DROP POLICY IF EXISTS "exercise-media authed insert" ON storage.objects;
DROP POLICY IF EXISTS "exercise-media authed update" ON storage.objects;
DROP POLICY IF EXISTS "exercise-media authed delete" ON storage.objects;

CREATE POLICY "exercise-media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exercise-media');

CREATE POLICY "exercise-media authed insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'exercise-media');

CREATE POLICY "exercise-media authed update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'exercise-media' AND owner = auth.uid());

CREATE POLICY "exercise-media authed delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'exercise-media' AND owner = auth.uid());
