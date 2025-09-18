-- Remove calculated columns that will be computed dynamically from channel_daily_stats
ALTER TABLE channels 
DROP COLUMN IF EXISTS views_last_30_days,
DROP COLUMN IF EXISTS views_delta_30_days,
DROP COLUMN IF EXISTS views_delta_7_days,
DROP COLUMN IF EXISTS views_delta_3_days,
DROP COLUMN IF EXISTS views_per_subscriber,
DROP COLUMN IF EXISTS uploads_last_30_days,
DROP COLUMN IF EXISTS videos_until_takeoff,
DROP COLUMN IF EXISTS days_until_takeoff,
DROP COLUMN IF EXISTS days_creation_to_first_upload;

-- Keep manual entry columns:
-- - sub_niche
-- - channel_type  
-- - thumbnail_style
-- - video_style
-- - video_length
-- - status
-- - notes
-- - channel_niche
-- - custom_fields (for user-added columns)
