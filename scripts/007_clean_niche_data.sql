-- Migration: Clean niche data
-- Priority: DATA QUALITY FIX
-- Removes trailing spaces from niche names and consolidates duplicates

-- Trim trailing/leading spaces from channel_niche
UPDATE public.channels
SET channel_niche = TRIM(channel_niche)
WHERE channel_niche IS NOT NULL 
  AND channel_niche != TRIM(channel_niche);

-- Optional: Set empty strings to NULL for consistency
UPDATE public.channels
SET channel_niche = NULL
WHERE channel_niche = '';

-- Check results
SELECT 
    channel_niche,
    COUNT(*) as channel_count
FROM public.channels
GROUP BY channel_niche
ORDER BY channel_count DESC;

