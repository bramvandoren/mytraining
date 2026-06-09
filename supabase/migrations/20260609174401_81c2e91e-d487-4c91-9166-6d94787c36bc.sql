
-- =====================================================================
-- PART 1: replace club_role enum (admin) -> (owner, admin, coach, assistant)
-- =====================================================================
DROP POLICY IF EXISTS "Admins add members"   ON public.club_members;
DROP POLICY IF EXISTS "Admins remove members" ON public.club_members;
DROP POLICY IF EXISTS "Admins update roles"  ON public.club_members;

DROP FUNCTION IF EXISTS public.has_club_role(uuid, uuid, public.club_role);

ALTER TABLE public.club_members ADD COLUMN role_txt text;
UPDATE public.club_members cm SET role_txt = CASE
  WHEN cm.role::text = 'admin'
       AND EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = cm.club_id AND c.owner_id = cm.user_id)
    THEN 'owner'
  WHEN cm.role::text = 'admin' THEN 'admin'
  ELSE 'coach'
END;

ALTER TABLE public.club_members ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.club_members DROP COLUMN role;
DROP TYPE public.club_role;
CREATE TYPE public.club_role AS ENUM ('owner','admin','coach','assistant');
ALTER TABLE public.club_members ADD COLUMN role public.club_role NOT NULL DEFAULT 'coach';
UPDATE public.club_members SET role = role_txt::public.club_role;
ALTER TABLE public.club_members DROP COLUMN role_txt;

CREATE OR REPLACE FUNCTION public.has_club_role(_club_id uuid, _user_id uuid, _role public.club_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS(SELECT 1 FROM public.club_members WHERE club_id=_club_id AND user_id=_user_id AND role=_role) $$;

CREATE OR REPLACE FUNCTION public.can_edit_club(_club_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS(SELECT 1 FROM public.club_members WHERE club_id=_club_id AND user_id=_user_id AND role IN ('owner','admin')) $$;

CREATE OR REPLACE FUNCTION public.can_create_in_club(_club_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS(SELECT 1 FROM public.club_members WHERE club_id=_club_id AND user_id=_user_id AND role IN ('owner','admin','coach')) $$;

-- Recreate club_members policies with new role values
CREATE POLICY "Admins add members" ON public.club_members FOR INSERT
  WITH CHECK (public.can_edit_club(club_id, auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "Admins remove members" ON public.club_members FOR DELETE
  USING (public.can_edit_club(club_id, auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "Admins update roles" ON public.club_members FOR UPDATE
  USING (public.can_edit_club(club_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_club_id UUID;
  display TEXT;
  uname TEXT;
BEGIN
  display := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
  uname   := COALESCE(NEW.raw_user_meta_data->>'username',     display);
  INSERT INTO public.profiles (id, display_name, username) VALUES (NEW.id, display, uname);
  INSERT INTO public.clubs (name, owner_id, is_personal)
    VALUES (display || '''s Club', NEW.id, true)
    RETURNING id INTO new_club_id;
  INSERT INTO public.club_members (club_id, user_id, role) VALUES (new_club_id, NEW.id, 'owner');
  RETURN NEW;
END $$;

-- =====================================================================
-- PART 2: shared updated_at trigger
-- =====================================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- =====================================================================
-- PART 3: Visibility
-- =====================================================================
CREATE TYPE public.content_visibility AS ENUM ('private','club','public','team');
ALTER TABLE public.custom_exercises    ADD COLUMN visibility public.content_visibility NOT NULL DEFAULT 'private';
ALTER TABLE public.training_sessions   ADD COLUMN visibility public.content_visibility NOT NULL DEFAULT 'private';
ALTER TABLE public.training_templates  ADD COLUMN visibility public.content_visibility NOT NULL DEFAULT 'private';
UPDATE public.custom_exercises   SET visibility='public' WHERE is_public=true;
UPDATE public.custom_exercises   SET visibility='club'   WHERE is_public=false AND club_id IS NOT NULL;
UPDATE public.training_sessions  SET visibility='club'   WHERE club_id IS NOT NULL;
UPDATE public.training_templates SET visibility='club'   WHERE club_id IS NOT NULL;
ALTER TABLE public.custom_exercises   ADD COLUMN team_id uuid;
ALTER TABLE public.training_sessions  ADD COLUMN team_id uuid;
ALTER TABLE public.training_templates ADD COLUMN team_id uuid;

-- =====================================================================
-- PART 4: teams + team_members
-- =====================================================================
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  age_category text,
  season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  color text,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_select_member" ON public.teams FOR SELECT TO authenticated USING (public.is_club_member(club_id, auth.uid()));
CREATE POLICY "teams_insert_editor" ON public.teams FOR INSERT TO authenticated WITH CHECK (public.can_edit_club(club_id, auth.uid()));
CREATE POLICY "teams_update_editor" ON public.teams FOR UPDATE TO authenticated USING (public.can_edit_club(club_id, auth.uid()));
CREATE POLICY "teams_delete_editor" ON public.teams FOR DELETE TO authenticated USING (public.can_edit_club(club_id, auth.uid()));
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.custom_exercises   ADD CONSTRAINT custom_exercises_team_fk   FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.training_sessions  ADD CONSTRAINT training_sessions_team_fk  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;
ALTER TABLE public.training_templates ADD CONSTRAINT training_templates_team_fk FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE TYPE public.team_member_role AS ENUM ('head_coach','assistant');
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.team_member_role NOT NULL DEFAULT 'assistant',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_members_select" ON public.team_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teams t WHERE t.id=team_id AND public.is_club_member(t.club_id, auth.uid())));
CREATE POLICY "team_members_mutate" ON public.team_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teams t WHERE t.id=team_id AND public.can_edit_club(t.club_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.teams t WHERE t.id=team_id AND public.can_edit_club(t.club_id, auth.uid())));

CREATE OR REPLACE FUNCTION public.is_team_head_coach(_team_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS(SELECT 1 FROM public.team_members WHERE team_id=_team_id AND user_id=_user_id AND role='head_coach') $$;

-- =====================================================================
-- PART 5: invitations
-- =====================================================================
CREATE TABLE public.club_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.club_role NOT NULL DEFAULT 'coach',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_invitations TO authenticated;
GRANT SELECT ON public.club_invitations TO anon;
GRANT ALL ON public.club_invitations TO service_role;
ALTER TABLE public.club_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_select_anon" ON public.club_invitations FOR SELECT TO anon USING (true);
CREATE POLICY "inv_select_auth" ON public.club_invitations FOR SELECT TO authenticated USING (true);
CREATE POLICY "inv_insert_admins" ON public.club_invitations FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_club(club_id, auth.uid()) AND invited_by = auth.uid());
CREATE POLICY "inv_update_admins_or_invitee" ON public.club_invitations FOR UPDATE TO authenticated
  USING (public.can_edit_club(club_id, auth.uid()) OR (auth.jwt()->>'email')=email);
CREATE POLICY "inv_delete_admins" ON public.club_invitations FOR DELETE TO authenticated
  USING (public.can_edit_club(club_id, auth.uid()));

-- =====================================================================
-- PART 6: activity log
-- =====================================================================
CREATE TYPE public.activity_action AS ENUM (
  'training_created','training_shared','training_scheduled',
  'exercise_created','exercise_shared',
  'template_created','template_updated',
  'team_created','team_updated','team_deleted',
  'coach_joined','coach_invited','coach_role_changed','coach_removed',
  'media_uploaded',
  'player_created','player_archived','player_transferred',
  'attendance_recorded'
);
CREATE TABLE public.club_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action public.activity_action NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.club_activity TO authenticated;
GRANT ALL ON public.club_activity TO service_role;
CREATE INDEX club_activity_club_created_idx ON public.club_activity(club_id, created_at DESC);
ALTER TABLE public.club_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_select_member" ON public.club_activity FOR SELECT TO authenticated USING (public.is_club_member(club_id, auth.uid()));
CREATE POLICY "activity_insert_member" ON public.club_activity FOR INSERT TO authenticated
  WITH CHECK (public.is_club_member(club_id, auth.uid()) AND (actor_id = auth.uid() OR actor_id IS NULL));

-- =====================================================================
-- PART 7: club_media table (bucket created separately via storage tool)
-- =====================================================================
CREATE TABLE public.club_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  folder text DEFAULT '/',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_media TO authenticated;
GRANT ALL ON public.club_media TO service_role;
ALTER TABLE public.club_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_select_member" ON public.club_media FOR SELECT TO authenticated USING (public.is_club_member(club_id, auth.uid()));
CREATE POLICY "media_insert_creator" ON public.club_media FOR INSERT TO authenticated
  WITH CHECK (public.can_create_in_club(club_id, auth.uid()) AND uploaded_by = auth.uid());
CREATE POLICY "media_update_admin_or_owner" ON public.club_media FOR UPDATE TO authenticated
  USING (public.can_edit_club(club_id, auth.uid()) OR uploaded_by = auth.uid());
CREATE POLICY "media_delete_admin_or_owner" ON public.club_media FOR DELETE TO authenticated
  USING (public.can_edit_club(club_id, auth.uid()) OR uploaded_by = auth.uid());

-- =====================================================================
-- PART 8: players
-- =====================================================================
CREATE TYPE public.player_foot     AS ENUM ('left','right','both');
CREATE TYPE public.player_position AS ENUM ('gk','def','mid','fwd');
CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  avatar_url text,
  birth_date date,
  nationality text,
  preferred_foot public.player_foot,
  position public.player_position,
  jersey_number int,
  notes text,
  emergency_contact text,
  parent_contact text,
  medical_notes text,
  archived_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_select_member" ON public.players FOR SELECT TO authenticated USING (public.is_club_member(club_id, auth.uid()));
CREATE POLICY "players_insert_creator" ON public.players FOR INSERT TO authenticated
  WITH CHECK (public.can_create_in_club(club_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "players_update_editor" ON public.players FOR UPDATE TO authenticated USING (public.can_create_in_club(club_id, auth.uid()));
CREATE POLICY "players_delete_admin" ON public.players FOR DELETE TO authenticated USING (public.can_edit_club(club_id, auth.uid()));
CREATE TRIGGER players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.player_team_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX player_active_assignment_uniq ON public.player_team_assignments(player_id) WHERE ended_at IS NULL;
CREATE INDEX player_team_assignments_team_idx ON public.player_team_assignments(team_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_team_assignments TO authenticated;
GRANT ALL ON public.player_team_assignments TO service_role;
ALTER TABLE public.player_team_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pta_select" ON public.player_team_assignments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.players p WHERE p.id=player_id AND public.is_club_member(p.club_id, auth.uid())));
CREATE POLICY "pta_mutate" ON public.player_team_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.players p WHERE p.id=player_id AND public.can_create_in_club(p.club_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.players p WHERE p.id=player_id AND public.can_create_in_club(p.club_id, auth.uid())));

CREATE OR REPLACE FUNCTION public.can_see_player_sensitive(_player_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$
  SELECT EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id = _player_id
      AND (
        public.can_edit_club(p.club_id, _user_id)
        OR EXISTS (
          SELECT 1 FROM public.player_team_assignments a
          JOIN public.team_members tm ON tm.team_id = a.team_id
          WHERE a.player_id = p.id AND a.ended_at IS NULL
            AND tm.user_id = _user_id AND tm.role = 'head_coach'
        )
      )
  )
$$;

CREATE OR REPLACE VIEW public.players_view
WITH (security_invoker = true) AS
SELECT
  p.id, p.club_id, p.first_name, p.last_name, p.avatar_url,
  p.birth_date, p.nationality, p.preferred_foot, p.position, p.jersey_number,
  p.notes, p.archived_at, p.created_by, p.created_at, p.updated_at,
  CASE WHEN public.can_see_player_sensitive(p.id, auth.uid()) THEN p.emergency_contact END AS emergency_contact,
  CASE WHEN public.can_see_player_sensitive(p.id, auth.uid()) THEN p.parent_contact    END AS parent_contact,
  CASE WHEN public.can_see_player_sensitive(p.id, auth.uid()) THEN p.medical_notes     END AS medical_notes,
  (SELECT a.team_id FROM public.player_team_assignments a WHERE a.player_id=p.id AND a.ended_at IS NULL LIMIT 1) AS current_team_id
FROM public.players p;
GRANT SELECT ON public.players_view TO authenticated;

-- =====================================================================
-- PART 9: attendance
-- =====================================================================
CREATE TYPE public.attendance_status AS ENUM ('present','absent','injured','late','excused');
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_training_id uuid NOT NULL REFERENCES public.scheduled_trainings(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL,
  note text,
  marked_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scheduled_training_id, player_id)
);
CREATE INDEX attendance_player_idx ON public.attendance_records(player_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "att_select" ON public.attendance_records FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.players p WHERE p.id=player_id AND public.is_club_member(p.club_id, auth.uid())));
CREATE POLICY "att_insert" ON public.attendance_records FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.players p WHERE p.id=player_id AND public.can_create_in_club(p.club_id, auth.uid())) AND marked_by = auth.uid());
CREATE POLICY "att_update" ON public.attendance_records FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.players p WHERE p.id=player_id AND public.can_create_in_club(p.club_id, auth.uid())));
CREATE POLICY "att_delete" ON public.attendance_records FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.players p WHERE p.id=player_id AND public.can_edit_club(p.club_id, auth.uid())));
CREATE TRIGGER att_updated_at BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =====================================================================
-- PART 10: refine SELECT policies for visibility on existing tables
-- =====================================================================
DROP POLICY IF EXISTS "Users can view their own custom exercises" ON public.custom_exercises;
DROP POLICY IF EXISTS "Anyone can view public custom exercises"   ON public.custom_exercises;
DROP POLICY IF EXISTS "Users can view club custom exercises"      ON public.custom_exercises;
CREATE POLICY "ce_select_visibility" ON public.custom_exercises FOR SELECT
  USING (
    visibility='public'
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (visibility='club' AND club_id IS NOT NULL AND public.is_club_member(club_id, auth.uid()))
    OR (visibility='team' AND team_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = custom_exercises.team_id AND tm.user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view their own sessions" ON public.training_sessions;
DROP POLICY IF EXISTS "Users can view club sessions"      ON public.training_sessions;
CREATE POLICY "ts_select_visibility" ON public.training_sessions FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (visibility='public')
    OR (visibility='club' AND club_id IS NOT NULL AND public.is_club_member(club_id, auth.uid()))
    OR (visibility='team' AND team_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = training_sessions.team_id AND tm.user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view their own templates" ON public.training_templates;
DROP POLICY IF EXISTS "Users can view club templates"      ON public.training_templates;
CREATE POLICY "tt_select_visibility" ON public.training_templates FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (visibility='public')
    OR (visibility='club' AND club_id IS NOT NULL AND public.is_club_member(club_id, auth.uid()))
    OR (visibility='team' AND team_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = training_templates.team_id AND tm.user_id = auth.uid()))
  );

-- =====================================================================
-- PART 11: activity triggers
-- =====================================================================
CREATE OR REPLACE FUNCTION public.tg_log_player_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO public.club_activity(club_id,actor_id,action,entity_type,entity_id,metadata)
      VALUES (NEW.club_id, NEW.created_by, 'player_created', 'player', NEW.id, jsonb_build_object('name', NEW.first_name || ' ' || NEW.last_name));
  ELSIF TG_OP='UPDATE' AND OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL THEN
    INSERT INTO public.club_activity(club_id,actor_id,action,entity_type,entity_id,metadata)
      VALUES (NEW.club_id, auth.uid(), 'player_archived', 'player', NEW.id, jsonb_build_object('name', NEW.first_name || ' ' || NEW.last_name));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER players_activity AFTER INSERT OR UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_player_activity();

CREATE OR REPLACE FUNCTION public.tg_log_team_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO public.club_activity(club_id,actor_id,action,entity_type,entity_id,metadata)
      VALUES (NEW.club_id, NEW.created_by, 'team_created', 'team', NEW.id, jsonb_build_object('name', NEW.name));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER teams_activity AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_team_activity();
