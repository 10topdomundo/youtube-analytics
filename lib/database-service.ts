import type {
  Channel,
  ChannelStatistics,
  ChannelRanks,
  ChannelDailyStats,
  ChannelSocialLinks,
  ChannelAnalytics,
  ChannelCalculatedMetrics,
  ChannelWithMetrics,
  TimePeriod,
} from "./types"
import { createClient } from "./supabase/server"

// Supabase database service
class DatabaseService {
  private async getSupabaseClient() {
    return await createClient()
  }

  async getChannel(channelId: string): Promise<Channel | null> {
    const supabase = await this.getSupabaseClient()
    const { data, error } = await supabase.from("channels").select("*").eq("channel_id", channelId).single()

    if (error || !data) return null
    return this.mapDbChannelToChannel(data)
  }

  async getAllChannels(): Promise<Channel[]> {
    const supabase = await this.getSupabaseClient()
    const { data, error } = await supabase.from("channels").select("*").order("created_at", { ascending: false })

    if (error || !data) return []
    return data.map(this.mapDbChannelToChannel)
  }

  async getChannelsPaginated(page: number = 1, limit: number = 10): Promise<{ channels: Channel[], total: number }> {
    const supabase = await this.getSupabaseClient()
    
    // Get total count
    const { count } = await supabase
      .from("channels")
      .select("*", { count: 'exact', head: true })
    
    // Get paginated data
    const offset = (page - 1) * limit
    const { data, error } = await supabase
      .from("channels")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error || !data) return { channels: [], total: 0 }
    
    return {
      channels: data.map(this.mapDbChannelToChannel),
      total: count || 0
    }
  }

  async getChannelsWithMetricsPaginated(page: number = 1, limit: number = 10): Promise<{ channels: ChannelWithMetrics[], total: number, totalPages: number }> {
    // Get paginated channels
    const { channels, total } = await this.getChannelsPaginated(page, limit)
    
    if (channels.length === 0) {
      return { channels: [], total: 0, totalPages: 0 }
    }

    // Fetch metrics only for the current page's channels
    const channelIds = channels.map(c => c.id)
    const supabase = await this.getSupabaseClient()
    
    // Batch fetch statistics and daily stats for current page only
    const [statisticsData, dailyStatsData] = await Promise.all([
      supabase
        .from("channel_statistics")
        .select(`*, channels!inner(channel_id)`)
        .in('channel_id', channelIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("channel_daily_stats")
        .select(`*, channels!inner(channel_id)`)
        .in('channel_id', channelIds)
        .gte("date", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order("date", { ascending: true })
    ])

    // Create lookup maps
    const statisticsMap = new Map<string, ChannelStatistics>()
    statisticsData.data?.forEach(item => {
      const channelId = (item as any).channels.channel_id
      statisticsMap.set(channelId, this.mapDbStatsToStats(item, channelId))
    })
    
    const dailyStatsMap = new Map<string, ChannelDailyStats[]>()
    dailyStatsData.data?.forEach(item => {
      const channelId = (item as any).channels.channel_id
      if (!dailyStatsMap.has(channelId)) {
        dailyStatsMap.set(channelId, [])
      }
      dailyStatsMap.get(channelId)!.push(this.mapDbDailyStatsToStats(item, channelId))
    })
    
    // Calculate metrics for current page
    const channelsWithMetrics = channels.map(channel => {
      const statistics = statisticsMap.get(channel.channel_id) || null
      const dailyStats = dailyStatsMap.get(channel.channel_id) || []
      const calculated = this.calculateChannelMetricsFromCache(dailyStats, statistics)
      
      return {
        ...channel,
        calculated,
        statistics,
      }
    })

    return {
      channels: channelsWithMetrics,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }

  async getAllChannelsWithMetrics(): Promise<ChannelWithMetrics[]> {
    // Batch fetch all data upfront to avoid N+1 queries
    const [channels, allStatistics, allDailyStats] = await Promise.all([
      this.getAllChannels(),
      this.getAllChannelStatistics(),
      this.getAllChannelDailyStatsBatch()
    ])
    
    // Create lookup maps for O(1) access
    const statisticsMap = new Map<string, ChannelStatistics>()
    allStatistics.forEach(stat => {
      statisticsMap.set(stat.channel_id, stat)
    })
    
    const dailyStatsMap = new Map<string, ChannelDailyStats[]>()
    allDailyStats.forEach(stat => {
      if (!dailyStatsMap.has(stat.channel_id)) {
        dailyStatsMap.set(stat.channel_id, [])
      }
      dailyStatsMap.get(stat.channel_id)!.push(stat)
    })
    
    // Calculate metrics for all channels in parallel using cached data
    const metricsPromises = channels.map(async (channel) => {
      const statistics = statisticsMap.get(channel.channel_id) || null
      const dailyStats = dailyStatsMap.get(channel.channel_id) || []
      const calculated = this.calculateChannelMetricsFromCache(dailyStats, statistics)
      
      return {
        ...channel,
        calculated,
        statistics,
      }
    })

    return await Promise.all(metricsPromises)
  }

  async getAllChannelStatistics(): Promise<ChannelStatistics[]> {
    const supabase = await this.getSupabaseClient()
    const { data, error } = await supabase
      .from("channel_statistics")
      .select(`
        *,
        channels!inner(channel_id)
      `)
      .order("created_at", { ascending: false })

    if (error || !data) return []
    return data.map((item) => this.mapDbStatsToStats(item, (item as any).channels.channel_id))
  }

  async getAllChannelDailyStatsBatch(): Promise<ChannelDailyStats[]> {
    const supabase = await this.getSupabaseClient()
    // Get last 90 days of data for all channels to optimize performance
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const { data, error } = await supabase
      .from("channel_daily_stats")
      .select(`
        *,
        channels!inner(channel_id)
      `)
      .gte("date", ninetyDaysAgo.toISOString().split('T')[0])
      .order("date", { ascending: true })

    if (error || !data) return []
    return data.map((item) => this.mapDbDailyStatsToStats(item, (item as any).channels.channel_id))
  }

  calculateChannelMetricsFromCache(dailyStats: ChannelDailyStats[], statistics: ChannelStatistics | null): ChannelCalculatedMetrics {
    if (dailyStats.length === 0) {
      return {
        views_last_30_days: 0,
        views_last_7_days: 0,
        views_last_3_days: 0,
        views_delta_30_days: 0,
        views_delta_7_days: 0,
        views_delta_3_days: 0,
        views_per_subscriber: 0,
      }
    }

    // Sort daily stats by date to ensure proper calculation
    const sortedStats = dailyStats.sort((a, b) => new Date(a.stat_date).getTime() - new Date(b.stat_date).getTime())
    
    // Get latest and previous data points for delta calculations
    const latestStats = sortedStats[sortedStats.length - 1]
    const stats30DaysAgo = sortedStats[Math.max(0, sortedStats.length - 30)]
    const stats7DaysAgo = sortedStats[Math.max(0, sortedStats.length - 7)]
    const stats3DaysAgo = sortedStats[Math.max(0, sortedStats.length - 3)]

    // Calculate views for the last periods (difference from previous point)
    const views30Days = latestStats && stats30DaysAgo ? latestStats.views - stats30DaysAgo.views : 0
    const views7Days = latestStats && stats7DaysAgo ? latestStats.views - stats7DaysAgo.views : 0
    const views3Days = latestStats && stats3DaysAgo ? latestStats.views - stats3DaysAgo.views : 0

    // Calculate delta percentages (comparing current period to previous period of same length)
    const stats60DaysAgo = sortedStats[Math.max(0, sortedStats.length - 60)]
    const stats14DaysAgo = sortedStats[Math.max(0, sortedStats.length - 14)]
    const stats6DaysAgo = sortedStats[Math.max(0, sortedStats.length - 6)]

    const prevViews30Days = stats30DaysAgo && stats60DaysAgo ? stats30DaysAgo.views - stats60DaysAgo.views : 0
    const prevViews7Days = stats7DaysAgo && stats14DaysAgo ? stats7DaysAgo.views - stats14DaysAgo.views : 0
    const prevViews3Days = stats3DaysAgo && stats6DaysAgo ? stats3DaysAgo.views - stats6DaysAgo.views : 0

    // Calculate deltas
    const delta30Days = prevViews30Days > 0 ? ((views30Days - prevViews30Days) / prevViews30Days) * 100 : 0
    const delta7Days = prevViews7Days > 0 ? ((views7Days - prevViews7Days) / prevViews7Days) * 100 : 0
    const delta3Days = prevViews3Days > 0 ? ((views3Days - prevViews3Days) / prevViews3Days) * 100 : 0

    // Calculate views per subscriber
    const viewsPerSubscriber = statistics && statistics.total_subscribers > 0 
      ? statistics.total_views / statistics.total_subscribers 
      : 0

    return {
      views_last_30_days: Math.max(0, views30Days),
      views_last_7_days: Math.max(0, views7Days),
      views_last_3_days: Math.max(0, views3Days),
      views_delta_30_days: delta30Days,
      views_delta_7_days: delta7Days,
      views_delta_3_days: delta3Days,
      views_per_subscriber: viewsPerSubscriber,
    }
  }

  async calculateChannelMetrics(channelId: string): Promise<ChannelCalculatedMetrics> {
    const dailyStats = await this.getChannelDailyStats(channelId, 365) // Get full year for takeoff analysis
    const statistics = await this.getChannelStatistics(channelId)
    const channel = await this.getChannel(channelId)

    if (dailyStats.length === 0) {
      return {
        views_last_30_days: 0,
        views_last_7_days: 0,
        views_last_3_days: 0,
        views_delta_30_days: 0,
        views_delta_7_days: 0,
        views_delta_3_days: 0,
        views_per_subscriber: 0,
      }
    }

    // Sort daily stats by date to ensure proper calculation
    const sortedStats = dailyStats.sort((a, b) => new Date(a.stat_date).getTime() - new Date(b.stat_date).getTime())
    
    // Get latest and previous data points for delta calculations
    const latestStats = sortedStats[sortedStats.length - 1]
    const stats30DaysAgo = sortedStats[Math.max(0, sortedStats.length - 30)]
    const stats7DaysAgo = sortedStats[Math.max(0, sortedStats.length - 7)]
    const stats3DaysAgo = sortedStats[Math.max(0, sortedStats.length - 3)]

    // Calculate views for the last periods (difference from previous point)
    const views30Days = latestStats && stats30DaysAgo ? latestStats.views - stats30DaysAgo.views : 0
    const views7Days = latestStats && stats7DaysAgo ? latestStats.views - stats7DaysAgo.views : 0
    const views3Days = latestStats && stats3DaysAgo ? latestStats.views - stats3DaysAgo.views : 0

    // Calculate delta percentages (comparing current period to previous period of same length)
    const stats60DaysAgo = sortedStats[Math.max(0, sortedStats.length - 60)]
    const stats14DaysAgo = sortedStats[Math.max(0, sortedStats.length - 14)]
    const stats6DaysAgo = sortedStats[Math.max(0, sortedStats.length - 6)]

    const prevViews30Days = stats30DaysAgo && stats60DaysAgo ? stats30DaysAgo.views - stats60DaysAgo.views : 0
    const prevViews7Days = stats7DaysAgo && stats14DaysAgo ? stats7DaysAgo.views - stats14DaysAgo.views : 0
    const prevViews3Days = stats3DaysAgo && stats6DaysAgo ? stats3DaysAgo.views - stats6DaysAgo.views : 0

    // Calculate deltas
    const delta30Days = prevViews30Days > 0 ? ((views30Days - prevViews30Days) / prevViews30Days) * 100 : 0
    const delta7Days = prevViews7Days > 0 ? ((views7Days - prevViews7Days) / prevViews7Days) * 100 : 0
    const delta3Days = prevViews3Days > 0 ? ((views3Days - prevViews3Days) / prevViews3Days) * 100 : 0

    // Calculate views per subscriber
    const viewsPerSubscriber = statistics && statistics.total_subscribers > 0 
      ? statistics.total_views / statistics.total_subscribers 
      : 0

    return {
      views_last_30_days: Math.max(0, views30Days),
      views_last_7_days: Math.max(0, views7Days),
      views_last_3_days: Math.max(0, views3Days),
      views_delta_30_days: delta30Days,
      views_delta_7_days: delta7Days,
      views_delta_3_days: delta3Days,
      views_per_subscriber: viewsPerSubscriber,
    }
  }

  async calculateChannelMetricsOptimized(channel: Channel): Promise<ChannelCalculatedMetrics> {
    // This version avoids redundant getChannel call since we already have the channel data
    const [dailyStats, statistics] = await Promise.all([
      this.getChannelDailyStats(channel.channel_id, 365), // Get full year for takeoff analysis
      this.getChannelStatistics(channel.channel_id)
    ])

    if (dailyStats.length === 0) {
      return {
        views_last_30_days: 0,
        views_last_7_days: 0,
        views_last_3_days: 0,
        views_delta_30_days: 0,
        views_delta_7_days: 0,
        views_delta_3_days: 0,
        views_per_subscriber: 0,
      }
    }

    const sortedStats = dailyStats.sort((a, b) => new Date(a.stat_date).getTime() - new Date(b.stat_date).getTime())
    
    const latestStats = sortedStats[sortedStats.length - 1]
    const stats30DaysAgo = sortedStats[Math.max(0, sortedStats.length - 30)]
    const stats7DaysAgo = sortedStats[Math.max(0, sortedStats.length - 7)]
    const stats3DaysAgo = sortedStats[Math.max(0, sortedStats.length - 3)]

    const views30Days = latestStats && stats30DaysAgo ? latestStats.views - stats30DaysAgo.views : 0
    const views7Days = latestStats && stats7DaysAgo ? latestStats.views - stats7DaysAgo.views : 0
    const views3Days = latestStats && stats3DaysAgo ? latestStats.views - stats3DaysAgo.views : 0

    const stats60DaysAgo = sortedStats[Math.max(0, sortedStats.length - 60)]
    const stats14DaysAgo = sortedStats[Math.max(0, sortedStats.length - 14)]
    const stats6DaysAgo = sortedStats[Math.max(0, sortedStats.length - 6)]

    const prevViews30Days = stats30DaysAgo && stats60DaysAgo ? stats30DaysAgo.views - stats60DaysAgo.views : 0
    const prevViews7Days = stats7DaysAgo && stats14DaysAgo ? stats7DaysAgo.views - stats14DaysAgo.views : 0
    const prevViews3Days = stats3DaysAgo && stats6DaysAgo ? stats3DaysAgo.views - stats6DaysAgo.views : 0

    const delta30Days = prevViews30Days > 0 ? ((views30Days - prevViews30Days) / prevViews30Days) * 100 : 0
    const delta7Days = prevViews7Days > 0 ? ((views7Days - prevViews7Days) / prevViews7Days) * 100 : 0
    const delta3Days = prevViews3Days > 0 ? ((views3Days - prevViews3Days) / prevViews3Days) * 100 : 0

    // Removed uploads_last_30_days calculation - was incorrectly assuming upload rate based on channel age

    const currentSubscribers = statistics?.total_subscribers || 0
    const viewsPerSubscriber = currentSubscribers > 0 ? views30Days / currentSubscribers : 0

    // Removed all assumption-based calculations:
    // - videos_until_takeoff: based on assumed upload rate
    // - days_until_takeoff: based on assumed "takeoff point" algorithm
    // - days_creation_to_first_upload: hardcoded to 30 days

    return {
      views_last_30_days: views30Days,
      views_last_7_days: views7Days,
      views_last_3_days: views3Days,
      views_delta_30_days: delta30Days,
      views_delta_7_days: delta7Days,
      views_delta_3_days: delta3Days,
      views_per_subscriber: viewsPerSubscriber,
    }
  }

  // Removed findTakeoffPoint and getChannelsWithTakeoff functions
  // These were making assumptions about "takeoff" without reliable data from SocialBlade

  async addChannel(channel: Channel): Promise<void> {
    const supabase = await this.getSupabaseClient()
    const { error } = await supabase.from("channels").insert({
      channel_id: channel.channel_id,
      channel_name: channel.channel_name,
      channel_handle: channel.channel_handle,
      channel_description: channel.channel_description,
      channel_thumbnail_url: channel.channel_thumbnail_url,
      channel_banner_url: channel.channel_banner_url,
      channel_country: channel.channel_country,
      channel_language: channel.channel_language,
      channel_created_date: channel.channel_created_date,
      channel_keywords: channel.channel_keywords,
      channel_niche: channel.channel_niche,
      sub_niche: channel.sub_niche,
      channel_type: channel.channel_type,
      thumbnail_style: channel.thumbnail_style,
      video_style: channel.video_style,
      video_length: channel.video_length,
      status: channel.status,
      notes: channel.notes,
      custom_fields: channel.custom_fields,
    })

    if (error) throw error
  }

  async updateChannel(channelId: string, updates: Partial<Channel>): Promise<void> {
    const supabase = await this.getSupabaseClient()
    const { error } = await supabase
      .from("channels")
      .update({
        channel_name: updates.channel_name,
        channel_handle: updates.channel_handle,
        channel_description: updates.channel_description,
        channel_thumbnail_url: updates.channel_thumbnail_url,
        channel_banner_url: updates.channel_banner_url,
        channel_country: updates.channel_country,
        channel_language: updates.channel_language,
        channel_keywords: updates.channel_keywords,
        channel_niche: updates.channel_niche,
        sub_niche: updates.sub_niche,
        channel_type: updates.channel_type,
        thumbnail_style: updates.thumbnail_style,
        video_style: updates.video_style,
        video_length: updates.video_length,
        status: updates.status,
        notes: updates.notes,
        custom_fields: updates.custom_fields,
      })
      .eq("channel_id", channelId)

    if (error) throw error
  }

  async deleteChannel(channelId: string): Promise<void> {
    const supabase = await this.getSupabaseClient()
    const { error } = await supabase.from("channels").delete().eq("channel_id", channelId)

    if (error) throw error
  }

  async getChannelStatistics(channelId: string): Promise<ChannelStatistics | null> {
    const supabase = await this.getSupabaseClient()
    
    // Optimized: Single query with JOIN instead of double lookup
    const { data, error } = await supabase
      .from("channel_statistics")
      .select(`
        *,
        channels!inner(channel_id)
      `)
      .eq("channels.channel_id", channelId)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.log(`Statistics error for ${channelId}:`, error)
      return null
    }
    
    if (!data) {
      console.log(`No statistics found for ${channelId}`)
      return null
    }
    
    console.log(`Statistics found for ${channelId}:`, data)
    return this.mapDbStatsToStats(data, channelId)
  }

  async updateChannelStatistics(channelId: string, stats: Omit<ChannelStatistics, "id" | "channel_id">): Promise<void> {
    const supabase = await this.getSupabaseClient()

    // Get channel UUID from channel_id
    const { data: channelData } = await supabase.from("channels").select("id").eq("channel_id", channelId).single()

    if (!channelData) throw new Error("Channel not found")

    const { error } = await supabase.from("channel_statistics").insert({
      channel_id: channelData.id,
      total_uploads: stats.total_uploads,
      total_subscribers: stats.total_subscribers,
      total_views: stats.total_views,
      total_likes: stats.total_likes,
      total_comments: stats.total_comments,
    })

    if (error) throw error
  }

  async getChannelRanks(channelId: string): Promise<ChannelRanks | null> {
    const supabase = await this.getSupabaseClient()
    
    // Optimized: Single query with JOIN instead of double lookup
    const { data, error } = await supabase
      .from("channel_ranks")
      .select(`
        *,
        channels!inner(channel_id)
      `)
      .eq("channels.channel_id", channelId)
      .order("rank_date", { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null
    return this.mapDbRanksToRanks(data, channelId)
  }

  async updateChannelRanks(channelId: string, ranks: Omit<ChannelRanks, "id" | "channel_id">): Promise<void> {
    const supabase = await this.getSupabaseClient()

    // Get channel UUID from channel_id
    const { data: channelData } = await supabase.from("channels").select("id").eq("channel_id", channelId).single()

    if (!channelData) throw new Error("Channel not found")

    const { error } = await supabase.from("channel_ranks").insert({
      channel_id: channelData.id,
      subscriber_rank: ranks.subscriber_rank,
      video_view_rank: ranks.video_view_rank,
      country_rank: ranks.country_rank,
      category_rank: ranks.category_rank,
      global_rank: ranks.global_rank,
    })

    if (error) throw error
  }

  async getChannelDailyStats(channelId: string, days = 30): Promise<ChannelDailyStats[]> {
    const supabase = await this.getSupabaseClient()
    
    // Optimized: Single query with JOIN instead of double lookup
    let query = supabase
      .from("channel_daily_stats")
      .select(`
        *,
        channels!inner(channel_id)
      `)
      .eq("channels.channel_id", channelId)
      .order("date", { ascending: true })

    // Only apply date filter if days is reasonable (not trying to get all data)
    if (days < 9999) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      query = query.gte("date", cutoffDate.toISOString().split("T")[0])
    }
    // For days >= 9999, fetch ALL available data (no date filter)

    const { data, error } = await query

    if (error || !data) return []
    return data.map((item) => this.mapDbDailyStatsToStats(item, (item as any).channels.channel_id))
  }

  async addDailyStats(channelId: string, stats: Omit<ChannelDailyStats, "id" | "channel_id">): Promise<void> {
    const supabase = await this.getSupabaseClient()

    // Get channel UUID from channel_id
    const { data: channelData } = await supabase.from("channels").select("id").eq("channel_id", channelId).single()

    if (!channelData) throw new Error("Channel not found")

    const { error } = await supabase.from("channel_daily_stats").insert({
      channel_id: channelData.id,
      date: stats.stat_date,
      subscribers: stats.subscribers,
      views: stats.views,
      estimated_earnings: stats.estimated_earnings,
      video_uploads: stats.video_uploads,
    })

    if (error) throw error
  }

  async getChannelSocialLinks(channelId: string): Promise<ChannelSocialLinks[]> {
    const supabase = await this.getSupabaseClient()
    
    // Optimized: Single query with JOIN instead of double lookup
    const { data, error } = await supabase
      .from("channel_social_links")
      .select(`
        *,
        channels!inner(channel_id)
      `)
      .eq("channels.channel_id", channelId)

    if (error || !data) return []
    return data.map((item) => this.mapDbSocialLinksToLinks(item, (item as any).channels.channel_id))
  }

  async updateChannelSocialLinks(
    channelId: string,
    links: Omit<ChannelSocialLinks, "id" | "channel_id">[],
  ): Promise<void> {
    const supabase = await this.getSupabaseClient()

    // Get channel UUID from channel_id
    const { data: channelData } = await supabase.from("channels").select("id").eq("channel_id", channelId).single()

    if (!channelData) throw new Error("Channel not found")

    // Delete existing links
    await supabase.from("channel_social_links").delete().eq("channel_id", channelData.id)

    // Insert new links
    if (links.length > 0) {
      const { error } = await supabase.from("channel_social_links").insert(
        links.map((link) => ({
          channel_id: channelData.id,
          platform: link.platform,
          url: link.url,
        })),
      )

      if (error) throw error
    }
  }

  async getChannelAnalytics(channelId: string, period: TimePeriod = 30): Promise<ChannelAnalytics | null> {
    // Optimized: Parallel fetch instead of sequential (5 queries → 1 batch of 5 parallel queries)
    const [channel, statistics, ranks, dailyStats, socialLinks] = await Promise.all([
      this.getChannel(channelId),
      this.getChannelStatistics(channelId),
      this.getChannelRanks(channelId),
      this.getChannelDailyStats(channelId, period),
      this.getChannelSocialLinks(channelId)
    ])

    if (!channel || !statistics || !ranks) {
      return null
    }

    // Calculate growth metrics
    const currentStats = dailyStats[dailyStats.length - 1]
    const previousStats = dailyStats[Math.max(0, dailyStats.length - period)]

    const subscribersChange = currentStats ? currentStats.subscribers - (previousStats?.subscribers || 0) : 0
    const viewsChange = currentStats ? currentStats.views - (previousStats?.views || 0) : 0

    const subscribersChangePercent = previousStats?.subscribers
      ? (subscribersChange / previousStats.subscribers) * 100
      : 0
    const viewsChangePercent = previousStats?.views ? (viewsChange / previousStats.views) * 100 : 0

    const viewsPerSubscriber = currentStats?.subscribers ? currentStats.views / currentStats.subscribers : 0

    return {
      channel,
      statistics,
      ranks,
      dailyStats,
      socialLinks,
      growth: {
        period,
        subscribersChange,
        subscribersChangePercent,
        viewsChange,
        viewsChangePercent,
        viewsPerSubscriber,
      },
    }
  }

  private mapDbChannelToChannel(data: any): Channel {
    return {
      id: data.id,
      channel_id: data.channel_id,
      channel_name: data.channel_name,
      channel_handle: data.channel_handle,
      channel_description: data.channel_description,
      channel_thumbnail_url: data.channel_thumbnail_url,
      channel_banner_url: data.channel_banner_url,
      channel_country: data.channel_country,
      channel_language: data.channel_language,
      channel_created_date: data.channel_created_date,
      channel_keywords: data.channel_keywords || [],
      channel_niche: data.channel_niche,
      sub_niche: data.sub_niche,
      channel_type: data.channel_type,
      thumbnail_style: data.thumbnail_style,
      video_style: data.video_style,
      video_length: data.video_length,
      status: data.status,
      notes: data.notes,
      custom_fields: data.custom_fields,
      // SocialBlade specific fields
      country_code: data.country_code,
      username: data.username,
      cusername: data.cusername,
      website: data.website,
      grade_color: data.grade_color,
      grade: data.grade,
      sb_verified: data.sb_verified,
      made_for_kids: data.made_for_kids,
      social_links: data.social_links,
    }
  }

  private mapDbStatsToStats(data: any, channelId: string): ChannelStatistics {
    return {
      id: data.id,
      channel_id: channelId,
      total_uploads: data.total_uploads,
      total_subscribers: data.total_subscribers,
      total_views: data.total_views,
      total_likes: data.total_likes,
      total_comments: data.total_comments,
    }
  }

  private mapDbRanksToRanks(data: any, channelId: string): ChannelRanks {
    return {
      id: data.id,
      channel_id: channelId,
      subscriber_rank: data.subscriber_rank,
      video_view_rank: data.video_view_rank,
      country_rank: data.country_rank,
      category_rank: data.category_rank,
      global_rank: data.global_rank,
    }
  }

  private mapDbDailyStatsToStats(data: any, channelId: string): ChannelDailyStats {
    return {
      id: data.id,
      channel_id: channelId,
      stat_date: data.date,
      subscribers: data.subscribers,
      views: data.views,
      estimated_earnings: Number.parseFloat(data.estimated_earnings || 0),
      video_uploads: data.video_uploads,
    }
  }

  private mapDbSocialLinksToLinks(data: any, channelId: string): ChannelSocialLinks {
    return {
      id: data.id,
      channel_id: channelId,
      platform: data.platform,
      url: data.url,
    }
  }
}

export const databaseService = new DatabaseService()
