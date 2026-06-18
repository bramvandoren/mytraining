-- The club-media bucket's RLS policies were added in
-- 20260609174439_f9c517c9-2eaf-4775-a8f9-377ed05e99c0.sql, but the
-- bucket itself was meant to be created manually via the Supabase
-- dashboard ("bucket created separately via storage tool") and never
-- was -- causing "bucket not found" on every club-media upload
-- (club media, and now club logos).
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-media', 'club-media', false)
ON CONFLICT (id) DO NOTHING;
