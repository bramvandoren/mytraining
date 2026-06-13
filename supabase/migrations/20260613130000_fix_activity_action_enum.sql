-- Add missing enum values to activity_action
-- 'match_created' was referenced by the match trigger but never added to the enum
ALTER TYPE public.activity_action ADD VALUE IF NOT EXISTS 'match_created';
ALTER TYPE public.activity_action ADD VALUE IF NOT EXISTS 'match_updated';
ALTER TYPE public.activity_action ADD VALUE IF NOT EXISTS 'announcement_created';
