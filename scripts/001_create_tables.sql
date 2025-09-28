-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id VARCHAR(255) UNIQUE NOT NULL,
  channel_name VARCHAR(255) NOT NULL,
  channel_handle VARCHAR(255),
  channel_description TEXT,
  channel_thumbnail_url TEXT,
  channel_banner_url TEXT,
  channel_country VARCHAR(10),
  channel_language VARCHAR(10),
  channel_created_date TIMESTAMP WITH TIME ZONE,
  channel_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channel_statistics table for snapshot total
CREATE TABLE IF NOT EXISTS channel_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  total_uploads INTEGER DEFAULT 0,
  total_subscribers INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  total_likes BIGINT DEFAULT 0,
  total_comments BIGINT DEFAULT 0,
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channel_ranks table for ranking information
CREATE TABLE IF NOT EXISTS channel_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  subscriber_rank INTEGER,
  video_view_rank INTEGER,
  country_rank INTEGER,
  category_rank INTEGER,
  global_rank INTEGER,
  rank_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channel_daily_stats table for time series data
CREATE TABLE IF NOT EXISTS channel_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subscribers INTEGER DEFAULT 0,
  views BIGINT DEFAULT 0,
  estimated_earnings DECIMAL(10,2) DEFAULT 0,
  video_uploads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, date)
);

-- Create channel_social_links table
CREATE TABLE IF NOT EXISTS channel_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_channels_channel_id ON channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_statistics_channel_id ON channel_statistics(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_ranks_channel_id ON channel_ranks(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_daily_stats_channel_id ON channel_daily_stats(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_daily_stats_date ON channel_daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_channel_social_links_channel_id ON channel_social_links(channel_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channel_statistics_updated_at BEFORE UPDATE ON channel_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channel_ranks_updated_at BEFORE UPDATE ON channel_ranks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channel_daily_stats_updated_at BEFORE UPDATE ON channel_daily_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channel_social_links_updated_at BEFORE UPDATE ON channel_social_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
