
-- =========================================================
-- Availability, Announcements, Notifications, Match Prep
-- =========================================================

-- ── availability_status enum ─────────────────────────────
CREATE TYPE public.availability_status AS ENUM ('available','unavailable','unsure','injured');

-- ── availability_records ─────────────────────────────────
CREATE TABLE public.availability_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id       UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL DEFAULT 'match',   -- 'match' | 'training'
  event_id      UUID NOT NULL,
  player_id     UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status        public.availability_status NOT NULL DEFAULT 'unsure',
  note          TEXT,
  requested_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responded_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_type, event_id, player_id)
);

CREATE INDEX availability_event_idx ON public.availability_records(event_type, event_id);
CREATE INDEX availability_player_idx ON public.availability_records(player_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_records TO authenticated;
GRANT ALL ON public.availability_records TO service_role;
ALTER TABLE public.availability_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability view" ON public.availability_records FOR SELECT TO authenticated
  USING (public.is_club_member(club_id, auth.uid()));

CREATE POLICY "availability insert" ON public.availability_records FOR INSERT TO authenticated
  WITH CHECK (public.is_club_member(club_id, auth.uid()));

CREATE POLICY "availability update" ON public.availability_records FOR UPDATE TO authenticated
  USING (public.is_club_member(club_id, auth.uid()));

CREATE POLICY "availability delete" ON public.availability_records FOR DELETE TO authenticated
  USING (public.can_create_in_club(club_id, auth.uid()));

CREATE TRIGGER availability_updated BEFORE UPDATE ON public.availability_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── announcements ─────────────────────────────────────────
CREATE TABLE public.announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id    UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  team_id    UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  author_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinned     BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX announcements_club_idx ON public.announcements(club_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements view" ON public.announcements FOR SELECT TO authenticated
  USING (public.is_club_member(club_id, auth.uid()));

CREATE POLICY "announcements insert" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (public.can_create_in_club(club_id, auth.uid()) AND author_id = auth.uid());

CREATE POLICY "announcements update" ON public.announcements FOR UPDATE TO authenticated
  USING (public.can_create_in_club(club_id, auth.uid()));

CREATE POLICY "announcements delete" ON public.announcements FOR DELETE TO authenticated
  USING (public.can_edit_club(club_id, auth.uid()) OR author_id = auth.uid());

CREATE TRIGGER announcements_updated BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- log announcement activity
CREATE OR REPLACE FUNCTION public.tg_log_announcement_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.club_activity(club_id, actor_id, action, entity_type, entity_id, metadata)
      VALUES (NEW.club_id, NEW.author_id, 'announcement_created', 'announcement', NEW.id,
              jsonb_build_object('title', NEW.title));
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER announcements_activity AFTER INSERT ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_announcement_activity();

-- ── notification_type enum ────────────────────────────────
CREATE TYPE public.notification_type AS ENUM (
  'new_training',
  'training_changed',
  'match_scheduled',
  'match_selection',
  'availability_request',
  'club_announcement'
);

-- ── notifications ─────────────────────────────────────────
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id     UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  type        public.notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  entity_type TEXT,
  entity_id   UUID,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON public.notifications(user_id, read) WHERE read = false;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications view" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = notifications.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner','admin','coach')
    )
  );

CREATE POLICY "notifications update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications delete" ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── match_preparation ────────────────────────────────────
CREATE TABLE public.match_preparation (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          UUID NOT NULL UNIQUE REFERENCES public.matches(id) ON DELETE CASCADE,
  match_objectives  TEXT,
  tactical_notes    TEXT,
  opponent_analysis TEXT,
  coach_notes       TEXT,
  key_focus_points  TEXT,
  created_by        UUID NOT NULL REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_preparation TO authenticated;
GRANT ALL ON public.match_preparation TO service_role;
ALTER TABLE public.match_preparation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_prep view" ON public.match_preparation FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id AND public.is_club_member(m.club_id, auth.uid())
  ));

CREATE POLICY "match_prep write" ON public.match_preparation FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id AND public.can_create_in_club(m.club_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id AND public.can_create_in_club(m.club_id, auth.uid())
  ));

CREATE TRIGGER match_prep_updated BEFORE UPDATE ON public.match_preparation
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
