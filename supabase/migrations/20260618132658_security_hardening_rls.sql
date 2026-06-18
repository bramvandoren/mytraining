-- ============================================================
-- Security hardening (response to Supabase security advisor scan)
-- ============================================================

-- 1) Storage: drop the original unauthenticated write/delete policies
--    on exercise-media. These were superseded by the "...authed
--    insert/update/delete" policies added in a later migration, but
--    were never actually dropped, leaving anon able to write/delete
--    any file in the bucket.
DROP POLICY IF EXISTS "Anyone can upload exercise media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update exercise media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete exercise media" ON storage.objects;

-- 2) club_members: remove the unrestricted self-enrollment branch
--    (`auth.uid() = user_id`), which let any authenticated user add
--    themselves to any club, bypassing the invitation flow. The only
--    legitimate self-insert case is a user becoming owner of a club
--    they just created (see useCreateClub / handle_new_user); scope
--    self-insert to that case via clubs.owner_id. All other
--    membership changes must go through can_edit_club (admin/owner
--    adding someone) or the accept_invitation() RPC.
DROP POLICY IF EXISTS "Admins add members" ON public.club_members;
CREATE POLICY "Admins add members" ON public.club_members FOR INSERT
  WITH CHECK (
    public.can_edit_club(club_id, auth.uid())
    OR (
      auth.uid() = user_id
      AND EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.owner_id = auth.uid())
    )
  );

-- 3) notifications: a club member could insert a notification for
--    any user_id, including people outside the club. Require the
--    target user to actually be a member of the club.
DROP POLICY IF EXISTS "notifications insert" ON public.notifications;
CREATE POLICY "notifications insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR (
      EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = notifications.club_id
          AND cm.user_id = auth.uid()
          AND cm.role IN ('owner','admin','coach')
      )
      AND EXISTS (
        SELECT 1 FROM public.club_members target
        WHERE target.club_id = notifications.club_id
          AND target.user_id = notifications.user_id
      )
    )
  );

-- 4) Internal SECURITY DEFINER helper functions are only meant to be
--    called from within RLS policies (which already restrict their
--    tables `TO authenticated`). Postgres grants EXECUTE to PUBLIC by
--    default on function creation, which let anon call them directly
--    via RPC to probe club/team/player membership. Lock them down to
--    authenticated + service_role.
REVOKE EXECUTE ON FUNCTION public.is_club_member(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_club_role(uuid, uuid, public.club_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_edit_club(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_create_in_club(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_team_head_coach(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_see_player_sensitive(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_club_ids(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_club_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_club_role(uuid, uuid, public.club_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_edit_club(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_create_in_club(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_team_head_coach(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_see_player_sensitive(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_club_ids(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated, service_role;

-- get_invitation_by_token and get_shared_session intentionally stay
-- anon-callable: they back unauthenticated invite/share links. Strip
-- the redundant implicit PUBLIC grant and keep the explicit ones.
REVOKE EXECUTE ON FUNCTION public.get_invitation_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_shared_session(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_session(text) TO anon, authenticated, service_role;

-- 5) Function search_path hardening: tg_set_updated_at was missing
--    `SET search_path`.
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
