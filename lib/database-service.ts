import type {
  Channel,
  ChannelStatistics,
  ChannelRanks,
  ChannelDailyStats,
  ChannelSocialLinks,
  ChannelAnalytics,
  ChannelCalculatedMetrics,
  ChannelWithMetrics,
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

  async getAllChannelsWithMetrics(): Promise<ChannelWithMetrics[]> {
    const channels = await this.getAllChannels()
    
    // Optimize by running all calculations in parallel and passing channel data to avoid redundant queries
    const metricsPromises = channels.map(async (channel) => {
      const [calculated, statistics] = await Promise.all([
        this.calculateChannelMetricsOptimized(channel),
        this.getChannelStatistics(channel.channel_id)
      ])
      
      return {
        ...channel,
        calculated,
        statistics,
      }
    })

    return await Promise.all(metricsPromises)
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
    const currentSubscribers = statistics?.total_subscribers || 0
    const viewsPerSubscriber = currentSubscribers > 0 ? views30Days / currentSubscribers : 0

    // Removed all assumption-based calculations - SocialBlade doesn't provide this data

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
    
    // First get the channel UUID
    const { data: channelData } = await supabase
      .from("channels")
      .select("id")
      .eq("channel_id", channelId)
      .single()

    if (!channelData) {
      console.log(`No channel found for channel_id: ${channelId}`)
      return null
    }

    // Then get the statistics using the UUID
    const { data, error } = await supabase
      .from("channel_statistics")
      .select("*")
      .eq("channel_id", channelData.id)
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
    
    // First get the channel UUID
    const { data: channelData } = await supabase
      .from("channels")
      .select("id")
      .eq("channel_id", channelId)
      .single()

    if (!channelData) return null

    // Then get the ranks using the UUID
    const { data, error } = await supabase
      .from("channel_ranks")
      .select("*")
      .eq("channel_id", channelData.id)
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
    
    // First get the channel UUID
    const { data: channelData } = await supabase
      .from("channels")
      .select("id")
      .eq("channel_id", channelId)
      .single()

    if (!channelData) return []

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Then get the daily stats using the UUID
    const { data, error } = await supabase
      .from("channel_daily_stats")
      .select("*")
      .eq("channel_id", channelData.id)
      .gte("date", cutoffDate.toISOString().split("T")[0])
      .order("date", { ascending: true })

    if (error || !data) return []
    return data.map((item) => this.mapDbDailyStatsToStats(item, channelId))
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
    
    // First get the channel UUID
    const { data: channelData } = await supabase
      .from("channels")
      .select("id")
      .eq("channel_id", channelId)
      .single()

    if (!channelData) return []

    // Then get the social links using the UUID
    const { data, error } = await supabase
      .from("channel_social_links")
      .select("*")
      .eq("channel_id", channelData.id)

    if (error || !data) return []
    return data.map((item) => this.mapDbSocialLinksToLinks(item, channelId))
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

  async getChannelAnalytics(channelId: string, period: 3 | 7 | 30 = 30): Promise<ChannelAnalytics | null> {
    const channel = await this.getChannel(channelId)
    const statistics = await this.getChannelStatistics(channelId)
    const ranks = await this.getChannelRanks(channelId)
    const dailyStats = await this.getChannelDailyStats(channelId, period)
    const socialLinks = await this.getChannelSocialLinks(channelId)

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
