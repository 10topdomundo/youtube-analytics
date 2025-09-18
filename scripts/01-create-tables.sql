-- Updated database schema to match the provided structure exactly
-- Main channel table
CREATE TABLE channels (
    channel_id VARCHAR(64) PRIMARY KEY,
    display_name VARCHAR(255),
    handle VARCHAR(255),
    created_at DATE,
    channel_type VARCHAR(100),
    country_code CHAR(2),
    country VARCHAR(100),
    avatar_url TEXT,
    website TEXT,
    grade_color VARCHAR(10),
    grade VARCHAR(5),
    sb_verified BOOLEAN,
    made_for_kids BOOLEAN
);

-- Channel statistics (snapshot totals)
CREATE TABLE channel_statistics (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(64) REFERENCES channels(channel_id) ON DELETE CASCADE,
    uploads INT,
    subscribers INT,
    views BIGINT
);

-- Channel ranks (snapshot)
CREATE TABLE channel_ranks (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(64) REFERENCES channels(channel_id) ON DELETE CASCADE,
    sbrank INT,
    subscribers INT,
    views BIGINT,
    country_rank INT,
    channel_type VARCHAR(100)
);

-- Daily history (time series)
CREATE TABLE channel_daily_stats (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(64) REFERENCES channels(channel_id) ON DELETE CASCADE,
    stat_date DATE,
    subscribers INT,
    views BIGINT,
    UNIQUE(channel_id, stat_date)
);

-- Branding social links (since it's an array)
CREATE TABLE channel_social_links (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(64) REFERENCES channels(channel_id) ON DELETE CASCADE,
    platform VARCHAR(100),
    url TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_channels_channel_id ON channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_channels_channel_type ON channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_channel_daily_stats_channel_date ON channel_daily_stats(channel_id, stat_date);
CREATE INDEX IF NOT EXISTS idx_channel_daily_stats_date ON channel_daily_stats(stat_date);
