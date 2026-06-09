
-- club-media storage policies (files stored as "<club_id>/...")
CREATE POLICY "club_media_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='club-media' AND public.is_club_member(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "club_media_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='club-media' AND public.can_create_in_club(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "club_media_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id='club-media' AND public.can_edit_club(((storage.foldername(name))[1])::uuid, auth.uid()));
CREATE POLICY "club_media_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='club-media' AND public.can_edit_club(((storage.foldername(name))[1])::uuid, auth.uid()));

-- Tighten invitations: drop blanket anon/auth select policies, expose a single token-lookup function
DROP POLICY IF EXISTS "inv_select_anon" ON public.club_invitations;
DROP POLICY IF EXISTS "inv_select_auth" ON public.club_invitations;
REVOKE SELECT ON public.club_invitations FROM anon;

CREATE POLICY "inv_select_admins" ON public.club_invitations FOR SELECT TO authenticated
  USING (public.can_edit_club(club_id, auth.uid()) OR (auth.jwt()->>'email') = email);

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE(
  id uuid, club_id uuid, club_name text, email text,
  role public.club_role, expires_at timestamptz, accepted_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$
  SELECT i.id, i.club_id, c.name, i.email, i.role, i.expires_at, i.accepted_at
  FROM public.club_invitations i
  JOIN public.clubs c ON c.id = i.club_id
  WHERE i.token = _token
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS
$$
DECLARE
  inv RECORD;
  uemail text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'must be authenticated'; END IF;
  uemail := lower(auth.jwt()->>'email');
  SELECT * INTO inv FROM public.club_invitations WHERE token = _token FOR UPDATE;
  IF inv IS NULL THEN RAISE EXCEPTION 'invitation not found'; END IF;
  IF inv.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'invitation already used'; END IF;
  IF inv.expires_at < now() THEN RAISE EXCEPTION 'invitation expired'; END IF;
  IF lower(inv.email) <> uemail THEN RAISE EXCEPTION 'invitation email mismatch'; END IF;

  INSERT INTO public.club_members (club_id, user_id, role)
    VALUES (inv.club_id, auth.uid(), inv.role)
    ON CONFLICT (club_id, user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.club_invitations
     SET accepted_at = now(), accepted_by = auth.uid()
   WHERE id = inv.id;

  INSERT INTO public.club_activity(club_id, actor_id, action, entity_type, entity_id, metadata)
    VALUES (inv.club_id, auth.uid(), 'coach_joined', 'member', auth.uid(), jsonb_build_object('role', inv.role));

  RETURN inv.club_id;
END $$;
GRANT EXECUTE ON FUNCTION public.accept_invitation(text) TO authenticated;
