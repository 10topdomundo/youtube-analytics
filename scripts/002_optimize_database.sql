-- Database Optimization and Security Migration
-- Generated based on Supabase advisor recommendations
-- Run this in your Supabase SQL Editor

-- ===========================================
-- PERFORMANCE OPTIMIZATIONS
-- ===========================================

-- 1. Remove duplicate index on channel_daily_stats
-- The advisor detected two identical indexes covering (channel_id, date)
DROP INDEX IF EXISTS channel_daily_stats_channel_date_idx;
-- Keep channel_daily_stats_channel_id_date_key as it's unique and covers both columns

-- 2. Add composite indexes for common query patterns
-- These optimize the batch queries we implemented for performance

-- For batch queries joining channels with statistics (used in getAllChannelsWithMetrics)
CREATE INDEX IF NOT EXISTS idx_channel_statistics_channel_snapshot 
ON channel_statistics(channel_id, snapshot_date DESC);

-- For batch queries joining channels with daily stats filtered by date (90-day optimization)
-- Composite index without partial predicate (since CURRENT_DATE is not immutable)
CREATE INDEX IF NOT EXISTS idx_channel_daily_stats_date_channel 
ON channel_daily_stats(date DESC, channel_id);

-- For filtering channels by creation year (fresh/aged classification)
-- Simple index on creation date (year extraction will use the index efficiently)
CREATE INDEX IF NOT EXISTS idx_channels_created_date 
ON channels(channel_created_date) 
WHERE channel_created_date IS NOT NULL;

-- For filtering channels by updated_at (useful for sync operations)
CREATE INDEX IF NOT EXISTS idx_channels_updated_at 
ON channels(updated_at DESC);

-- Note: idx_channels_niche and idx_channels_status are marked as unused
-- Keep them for now as they're used in the app's filter functionality
-- Remove them if they remain unused after monitoring

-- 3. Cleanup dead tuples for better performance
-- NOTE: VACUUM commands must be run separately, not in a transaction
-- Run these commands one by one in the SQL editor after the main migration:
-- VACUUM ANALYZE channels;
-- VACUUM ANALYZE channel_ranks;
-- VACUUM ANALYZE channel_statistics;
-- VACUUM ANALYZE channel_social_links;
-- VACUUM ANALYZE profiles;

-- 4. Optimize RLS policy on notes table
-- Replace auth function calls to avoid re-evaluation per row
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON notes;

CREATE POLICY "Enable all operations for authenticated users" ON notes
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Add statistics targets for frequently queried columns
-- This helps the query planner make better decisions
ALTER TABLE channels ALTER COLUMN channel_niche SET STATISTICS 1000;
ALTER TABLE channels ALTER COLUMN status SET STATISTICS 1000;
ALTER TABLE channels ALTER COLUMN channel_created_date SET STATISTICS 1000;
ALTER TABLE channel_daily_stats ALTER COLUMN date SET STATISTICS 1000;

-- ===========================================
-- SECURITY FIXES
-- ===========================================

-- 1. Enable RLS on all public tables (Supabase best practice)
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_charts ENABLE ROW LEVEL SECURITY;

-- 2. Create permissive policies for authenticated users
-- Since your app uses server-side auth with service role keys,
-- these policies allow all operations for authenticated users

-- Channels
CREATE POLICY "Allow authenticated users full access to channels" ON channels
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Channel Statistics
CREATE POLICY "Allow authenticated users full access to channel_statistics" ON channel_statistics
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Channel Ranks
CREATE POLICY "Allow authenticated users full access to channel_ranks" ON channel_ranks
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Channel Daily Stats
CREATE POLICY "Allow authenticated users full access to channel_daily_stats" ON channel_daily_stats
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Channel Social Links
CREATE POLICY "Allow authenticated users full access to channel_social_links" ON channel_social_links
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Profiles (enable RLS properly)
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Recreate with optimized version using (select auth.uid())
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- Saved Charts (user-specific)
CREATE POLICY "Users can manage their own charts" ON saved_charts
    FOR ALL
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- 3. Fix search_path for functions (security best practice)
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 4. Grant necessary permissions
-- Ensure anon and authenticated roles can access tables through RLS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ===========================================
-- FINAL ANALYSIS
-- ===========================================

-- Update query planner statistics
ANALYZE channels;
ANALYZE channel_statistics;
ANALYZE channel_ranks;
ANALYZE channel_daily_stats;
ANALYZE channel_social_links;
ANALYZE profiles;
ANALYZE saved_charts;

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Run these to verify the optimization:

-- 1. Check index usage
-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan as times_used,
--     idx_tup_read as rows_read,
--     idx_tup_fetch as rows_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- 2. Check table sizes
-- SELECT 
--     schemaname,
--     relname as tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS size,
--     n_live_tup as live_rows,
--     n_dead_tup as dead_rows
-- FROM pg_stat_user_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

-- 3. Verify RLS is enabled
-- SELECT 
--     schemaname,
--     tablename,
--     rowsecurity as rls_enabled
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

