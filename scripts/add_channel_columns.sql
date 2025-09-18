-- Add additional columns to channels table for comprehensive channel data
ALTER TABLE channels 
ADD COLUMN IF NOT EXISTS views_last_30_days BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_delta_30_days DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_delta_7_days DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_delta_3_days DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_per_subscriber DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS uploads_last_30_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS videos_until_takeoff INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS days_until_takeoff INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS days_creation_to_first_upload INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sub_niche TEXT,
ADD COLUMN IF NOT EXISTS channel_type TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_style TEXT,
ADD COLUMN IF NOT EXISTS video_style TEXT,
ADD COLUMN IF NOT EXISTS video_length TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Create index on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_channels_niche ON channels(channel_niche);
CREATE INDEX IF NOT EXISTS idx_channels_status ON channels(status);
CREATE INDEX IF NOT EXISTS idx_channels_views_30d ON channels(views_last_30_days);
