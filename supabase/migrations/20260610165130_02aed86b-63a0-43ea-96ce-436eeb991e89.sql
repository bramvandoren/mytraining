
-- Enums
CREATE TYPE public.match_type AS ENUM ('league','cup','friendly');
CREATE TYPE public.match_venue AS ENUM ('home','away');
CREATE TYPE public.match_status AS ENUM ('scheduled','cancelled','completed');
CREATE TYPE public.squad_status AS ENUM ('selected','not_selected','injured','suspended');
CREATE TYPE public.match_event_type AS ENUM ('goal','assist','yellow_card','red_card');

-- matches
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  opponent TEXT NOT NULL,
  match_date DATE NOT NULL,
  kickoff_time TIME,
  location TEXT,
  competition TEXT,
  venue public.match_venue NOT NULL DEFAULT 'home',
  match_type public.match_type NOT NULL DEFAULT 'league',
  status public.match_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX matches_club_date_idx ON public.matches(club_id, match_date DESC);
CREATE INDEX matches_team_idx ON public.matches(team_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches view" ON public.matches FOR SELECT TO authenticated
  USING (public.is_club_member(club_id, auth.uid()));
CREATE POLICY "matches insert" ON public.matches FOR INSERT TO authenticated
  WITH CHECK (public.can_create_in_club(club_id, auth.uid()) AND created_by = auth.uid());
CREATE POLICY "matches update" ON public.matches FOR UPDATE TO authenticated
  USING (public.can_create_in_club(club_id, auth.uid()));
CREATE POLICY "matches delete" ON public.matches FOR DELETE TO authenticated
  USING (public.can_edit_club(club_id, auth.uid()));

CREATE TRIGGER matches_updated BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- match_squads
CREATE TABLE public.match_squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  status public.squad_status NOT NULL DEFAULT 'selected',
  is_starter BOOLEAN NOT NULL DEFAULT false,
  shirt_number INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, player_id)
);
CREATE INDEX match_squads_match_idx ON public.match_squads(match_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_squads TO authenticated;
GRANT ALL ON public.match_squads TO service_role;
ALTER TABLE public.match_squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "squad view" ON public.match_squads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.is_club_member(m.club_id, auth.uid())));
CREATE POLICY "squad write" ON public.match_squads FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.can_create_in_club(m.club_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.can_create_in_club(m.club_id, auth.uid())));

CREATE TRIGGER match_squads_updated BEFORE UPDATE ON public.match_squads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- match_lineups (one per match)
CREATE TABLE public.match_lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL UNIQUE REFERENCES public.matches(id) ON DELETE CASCADE,
  formation TEXT NOT NULL DEFAULT '4-3-3',
  positions JSONB NOT NULL DEFAULT '[]'::jsonb,
  bench JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_lineups TO authenticated;
GRANT ALL ON public.match_lineups TO service_role;
ALTER TABLE public.match_lineups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lineup view" ON public.match_lineups FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.is_club_member(m.club_id, auth.uid())));
CREATE POLICY "lineup write" ON public.match_lineups FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.can_create_in_club(m.club_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.can_create_in_club(m.club_id, auth.uid())));

CREATE TRIGGER match_lineups_updated BEFORE UPDATE ON public.match_lineups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- match_reports (one per match)
CREATE TABLE public.match_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL UNIQUE REFERENCES public.matches(id) ON DELETE CASCADE,
  our_score INT,
  opp_score INT,
  ht_our_score INT,
  ht_opp_score INT,
  what_went_well TEXT,
  what_to_improve TEXT,
  next_training_focus TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_reports TO authenticated;
GRANT ALL ON public.match_reports TO service_role;
ALTER TABLE public.match_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report view" ON public.match_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.is_club_member(m.club_id, auth.uid())));
CREATE POLICY "report write" ON public.match_reports FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.can_create_in_club(m.club_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.can_create_in_club(m.club_id, auth.uid())));

CREATE TRIGGER match_reports_updated BEFORE UPDATE ON public.match_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- match_events
CREATE TABLE public.match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
  event_type public.match_event_type NOT NULL,
  minute INT,
  note TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX match_events_match_idx ON public.match_events(match_id);
CREATE INDEX match_events_player_idx ON public.match_events(player_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_events TO authenticated;
GRANT ALL ON public.match_events TO service_role;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events view" ON public.match_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.is_club_member(m.club_id, auth.uid())));
CREATE POLICY "events write" ON public.match_events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.can_create_in_club(m.club_id, auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND public.can_create_in_club(m.club_id, auth.uid())));

-- activity log trigger
CREATE OR REPLACE FUNCTION public.tg_log_match_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO public.club_activity(club_id, actor_id, action, entity_type, entity_id, metadata)
      VALUES (NEW.club_id, NEW.created_by, 'match_created', 'match', NEW.id,
              jsonb_build_object('opponent', NEW.opponent, 'date', NEW.match_date));
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER matches_activity AFTER INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_match_activity();
