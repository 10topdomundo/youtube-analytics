-- Migration: Enable RLS on channel tables
-- Priority: CRITICAL SECURITY FIX
-- Run this immediately!

-- Enable RLS on channel_daily_stats
ALTER TABLE public.channel_daily_stats ENABLE ROW LEVEL SECURITY;

-- Enable RLS on channel_ranks  
ALTER TABLE public.channel_ranks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on channel_social_links
ALTER TABLE public.channel_social_links ENABLE ROW LEVEL SECURITY;

-- Enable RLS on channel_statistics
ALTER TABLE public.channel_statistics ENABLE ROW LEVEL SECURITY;

-- Add comments documenting the change
COMMENT ON TABLE public.channel_daily_stats IS 'Row Level Security enabled - policies control access';
COMMENT ON TABLE public.channel_ranks IS 'Row Level Security enabled - policies control access';
COMMENT ON TABLE public.channel_social_links IS 'Row Level Security enabled - policies control access';
COMMENT ON TABLE public.channel_statistics IS 'Row Level Security enabled - policies control access';

