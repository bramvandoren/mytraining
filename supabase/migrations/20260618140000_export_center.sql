-- ============================================================
-- Export Center: club branding (logo) + player evaluations
-- ============================================================

-- 1) Club logo: store the storage path (club-media bucket is
--    private; resolve to a signed URL on demand, same pattern as
--    useClubMedia.ts's getMediaSignedUrl).
ALTER TABLE public.clubs ADD COLUMN logo_storage_path text;

-- 2) Player evaluations (minimal feature to back the
--    "Player Evaluations" PDF export).
CREATE TABLE public.player_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  evaluator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluation_date date NOT NULL DEFAULT current_date,
  technical_rating smallint,
  tactical_rating smallint,
  physical_rating smallint,
  mental_rating smallint,
  overall_rating smallint,
  strengths text,
  areas_to_improve text,
  coach_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX player_evaluations_player_idx ON public.player_evaluations(player_id, evaluation_date DESC);
CREATE INDEX player_evaluations_club_idx ON public.player_evaluations(club_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_evaluations TO authenticated;
GRANT ALL ON public.player_evaluations TO service_role;
ALTER TABLE public.player_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evals_select" ON public.player_evaluations FOR SELECT TO authenticated
  USING (public.is_club_member(club_id, auth.uid()));

CREATE POLICY "evals_insert" ON public.player_evaluations FOR INSERT TO authenticated
  WITH CHECK (public.can_create_in_club(club_id, auth.uid()) AND evaluator_id = auth.uid());

CREATE POLICY "evals_update" ON public.player_evaluations FOR UPDATE TO authenticated
  USING (public.can_create_in_club(club_id, auth.uid()));

CREATE POLICY "evals_delete" ON public.player_evaluations FOR DELETE TO authenticated
  USING (public.can_edit_club(club_id, auth.uid()) OR evaluator_id = auth.uid());

CREATE TRIGGER evals_updated_at BEFORE UPDATE ON public.player_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
