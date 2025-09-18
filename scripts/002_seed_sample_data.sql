-- Insert sample channels
INSERT INTO channels (channel_id, channel_name, channel_handle, channel_description, channel_thumbnail_url, channel_country, channel_language, channel_created_date, channel_keywords) VALUES
('UC_x5XG1OV2P6uZZ5FSM9Ttw', 'Google Developers', '@googledevelopers', 'The Google Developers channel features talks from events, educational series, best practices, tips, and the latest updates across our products and platforms.', 'https://yt3.ggpht.com/ytc/AKedOLSKHtyTBNhJGH_XdxJaRee0h2Op8xda_-ca4rWdMw=s88-c-k-c0x00ffffff-no-rj', 'US', 'en', '2007-08-23T00:00:00Z', ARRAY['programming', 'development', 'google', 'technology']),
('UCsooa4yRKGN_zEE8iknghZA', 'TED-Ed', '@teded', 'TED-Ed''s commitment to creating lessons worth sharing is an extension of TED''s mission of spreading great ideas.', 'https://yt3.ggpht.com/ytc/AKedOLTNJA7dGaRZSvd_8VqKZ8ZqZQZqZQZqZQZqZQZqZQ=s88-c-k-c0x00ffffff-no-rj', 'US', 'en', '2011-03-01T00:00:00Z', ARRAY['education', 'learning', 'animation', 'ted']),
('UCJ0-OtVpF0wOKEqT2Z1HEtA', 'ElectroBOOM', '@electroboom', 'Entertainment and educational videos about electricity, science and technology! We are always trying to educate and entertain.', 'https://yt3.ggpht.com/ytc/AKedOLRmTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX=s88-c-k-c0x00ffffff-no-rj', 'CA', 'en', '2012-01-09T00:00:00Z', ARRAY['electronics', 'science', 'education', 'comedy']);

-- Insert sample statistics
INSERT INTO channel_statistics (channel_id, total_uploads, total_subscribers, total_views, total_likes, total_comments) VALUES
((SELECT id FROM channels WHERE channel_id = 'UC_x5XG1OV2P6uZZ5FSM9Ttw'), 2847, 2340000, 234567890, 1234567, 123456),
((SELECT id FROM channels WHERE channel_id = 'UCsooa4yRKGN_zEE8iknghZA'), 1923, 18900000, 3456789012, 23456789, 2345678),
((SELECT id FROM channels WHERE channel_id = 'UCJ0-OtVpF0wOKEqT2Z1HEtA'), 234, 5670000, 567890123, 5678901, 567890);

-- Insert sample ranks
INSERT INTO channel_ranks (channel_id, subscriber_rank, video_view_rank, country_rank, category_rank, global_rank) VALUES
((SELECT id FROM channels WHERE channel_id = 'UC_x5XG1OV2P6uZZ5FSM9Ttw'), 1250, 890, 45, 12, 234),
((SELECT id FROM channels WHERE channel_id = 'UCsooa4yRKGN_zEE8iknghZA'), 89, 67, 8, 3, 45),
((SELECT id FROM channels WHERE channel_id = 'UCJ0-OtVpF0wOKEqT2Z1HEtA'), 567, 432, 23, 8, 123);

-- Insert sample daily stats (last 30 days)
INSERT INTO channel_daily_stats (channel_id, date, subscribers, views, estimated_earnings, video_uploads)
SELECT 
  c.id,
  CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 29),
  CASE c.channel_id
    WHEN 'UC_x5XG1OV2P6uZZ5FSM9Ttw' THEN 2340000 + (random() * 1000)::int
    WHEN 'UCsooa4yRKGN_zEE8iknghZA' THEN 18900000 + (random() * 5000)::int
    WHEN 'UCJ0-OtVpF0wOKEqT2Z1HEtA' THEN 5670000 + (random() * 2000)::int
  END,
  CASE c.channel_id
    WHEN 'UC_x5XG1OV2P6uZZ5FSM9Ttw' THEN (random() * 50000)::bigint
    WHEN 'UCsooa4yRKGN_zEE8iknghZA' THEN (random() * 200000)::bigint
    WHEN 'UCJ0-OtVpF0wOKEqT2Z1HEtA' THEN (random() * 100000)::bigint
  END,
  (random() * 500)::decimal(10,2),
  CASE WHEN random() < 0.1 THEN 1 ELSE 0 END
FROM channels c;

-- Insert sample social links
INSERT INTO channel_social_links (channel_id, platform, url) VALUES
((SELECT id FROM channels WHERE channel_id = 'UC_x5XG1OV2P6uZZ5FSM9Ttw'), 'twitter', 'https://twitter.com/googledevs'),
((SELECT id FROM channels WHERE channel_id = 'UC_x5XG1OV2P6uZZ5FSM9Ttw'), 'website', 'https://developers.google.com'),
((SELECT id FROM channels WHERE channel_id = 'UCsooa4yRKGN_zEE8iknghZA'), 'twitter', 'https://twitter.com/teded'),
((SELECT id FROM channels WHERE channel_id = 'UCsooa4yRKGN_zEE8iknghZA'), 'website', 'https://ed.ted.com'),
((SELECT id FROM channels WHERE channel_id = 'UCJ0-OtVpF0wOKEqT2Z1HEtA'), 'twitter', 'https://twitter.com/electroboomguy'),
((SELECT id FROM channels WHERE channel_id = 'UCJ0-OtVpF0wOKEqT2Z1HEtA'), 'website', 'https://www.electroboom.com');
