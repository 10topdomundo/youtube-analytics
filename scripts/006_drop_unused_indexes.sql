-- Migration: Drop unused and redundant indexes
-- Priority: HIGH PERFORMANCE FIX
-- These indexes have never been used and waste space/slow writes

-- Drop unused indexes on channels table
DROP INDEX IF EXISTS public.idx_channels_niche;
DROP INDEX IF EXISTS public.idx_channels_status;
DROP INDEX IF EXISTS public.idx_channels_created_date;

-- Drop redundant index on channel_daily_stats (duplicates unique constraint)
DROP INDEX IF EXISTS public.idx_channel_daily_stats_date_channel;

-- Note: These indexes can be recreated later if queries start using them:
-- CREATE INDEX idx_channels_niche ON public.channels(channel_niche) WHERE channel_niche IS NOT NULL;
-- CREATE INDEX idx_channels_status ON public.channels(status) WHERE status != 'Active';

