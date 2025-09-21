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
    const channelsWithMetrics: ChannelWithMetrics[] = []

    for (const channel of channels) {
      const calculated = await this.calculateChannelMetrics(channel.channel_id)
      const statistics = await this.getChannelStatistics(channel.channel_id)
      
      channelsWithMetrics.push({
        ...channel,
        calculated,
        statistics, // Add statistics to the channel data
      })
    }

    return channelsWithMetrics
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
        uploads_last_30_days: 0,
      }
    }

    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Get stats for different periods
    const stats30Days = dailyStats.filter((stat) => new Date(stat.stat_date) >= thirtyDaysAgo)
    const stats7Days = dailyStats.filter((stat) => new Date(stat.stat_date) >= sevenDaysAgo)
    const stats3Days = dailyStats.filter((stat) => new Date(stat.stat_date) >= threeDaysAgo)
    const stats60Days = dailyStats.filter((stat) => new Date(stat.stat_date) >= sixtyDaysAgo)

    // Calculate views for periods
    const views30Days = stats30Days.reduce((sum, stat) => sum + stat.views, 0)
    const views7Days = stats7Days.reduce((sum, stat) => sum + stat.views, 0)
    const views3Days = stats3Days.reduce((sum, stat) => sum + stat.views, 0)

    // Calculate previous period views for deltas
    const prevStats30Days = stats60Days.filter(
      (stat) => new Date(stat.stat_date) < thirtyDaysAgo && new Date(stat.stat_date) >= sixtyDaysAgo,
    )
    const prevViews30Days = prevStats30Days.reduce((sum, stat) => sum + stat.views, 0)

    const prevStats7Days = stats30Days.filter(
      (stat) =>
        new Date(stat.stat_date) < sevenDaysAgo &&
        new Date(stat.stat_date) >= new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
    )
    const prevViews7Days = prevStats7Days.reduce((sum, stat) => sum + stat.views, 0)

    const prevStats3Days = stats7Days.filter(
      (stat) =>
        new Date(stat.stat_date) < threeDaysAgo &&
        new Date(stat.stat_date) >= new Date(threeDaysAgo.getTime() - 3 * 24 * 60 * 60 * 1000),
    )
    const prevViews3Days = prevStats3Days.reduce((sum, stat) => sum + stat.views, 0)

    // Calculate deltas
    const delta30Days = prevViews30Days > 0 ? ((views30Days - prevViews30Days) / prevViews30Days) * 100 : 0
    const delta7Days = prevViews7Days > 0 ? ((views7Days - prevViews7Days) / prevViews7Days) * 100 : 0
    const delta3Days = prevViews3Days > 0 ? ((views3Days - prevViews3Days) / prevViews3Days) * 100 : 0

    // Calculate uploads in last 30 days
    // Note: SocialBlade doesn't provide daily upload counts, so we'll estimate
    let uploads30Days = 0
    if (channel?.channel_created_date && statistics?.total_uploads) {
      const creationDate = new Date(channel.channel_created_date)
      const totalDaysSinceCreation = Math.floor((new Date().getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (totalDaysSinceCreation > 0) {
        const uploadsPerDay = statistics.total_uploads / totalDaysSinceCreation
        uploads30Days = Math.floor(uploadsPerDay * 30) // Estimate for last 30 days
      }
    }

    // Calculate views per subscriber
    const currentSubscribers = statistics?.total_subscribers || 0
    const viewsPerSubscriber = currentSubscribers > 0 ? views30Days / currentSubscribers : 0

    let videosUntilTakeoff: number | undefined
    let daysUntilTakeoff: number | undefined
    let daysCreationToFirstUpload: number | undefined

    if (channel?.channel_created_date) {
      const creationDate = new Date(channel.channel_created_date)
      
      // Since SocialBlade doesn't provide daily upload data, we can't determine the exact first upload date
      // We'll estimate based on the assumption that uploads started shortly after channel creation
      // For channels with uploads, assume first upload was within 30 days of creation
      if (statistics?.total_uploads && statistics.total_uploads > 0) {
        daysCreationToFirstUpload = 30 // Estimated - SocialBlade doesn't provide this data
      }

      // Find takeoff point: 50,000+ views in a month with 1000%+ increase
      const takeoffPoint = this.findTakeoffPoint(dailyStats)
      if (takeoffPoint && channel.channel_created_date) {
        const takeoffDate = new Date(takeoffPoint.date)
        daysUntilTakeoff = Math.floor((takeoffDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))

        // Since SocialBlade doesn't provide daily upload data, we can't calculate exact videos until takeoff
        // We'll estimate based on total uploads and time to takeoff
        const totalDaysSinceCreation = Math.floor((new Date().getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
        const daysToTakeoff = Math.floor((takeoffDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24))
        const totalUploads = statistics?.total_uploads || 0
        
        if (totalDaysSinceCreation > 0 && totalUploads > 0) {
          // Estimate uploads per day and multiply by days to takeoff
          const uploadsPerDay = totalUploads / totalDaysSinceCreation
          videosUntilTakeoff = Math.floor(uploadsPerDay * daysToTakeoff)
        }
      }
    }

    return {
      views_last_30_days: views30Days,
      views_last_7_days: views7Days,
      views_last_3_days: views3Days,
      views_delta_30_days: delta30Days,
      views_delta_7_days: delta7Days,
      views_delta_3_days: delta3Days,
      views_per_subscriber: viewsPerSubscriber,
      uploads_last_30_days: uploads30Days,
      videos_until_takeoff: videosUntilTakeoff,
      days_until_takeoff: daysUntilTakeoff,
      days_creation_to_first_upload: daysCreationToFirstUpload,
    }
  }

  private findTakeoffPoint(dailyStats: ChannelDailyStats[]): { date: string; views: number } | null {
    if (dailyStats.length < 60) return null // Need at least 2 months of data

    // Group stats by month
    const monthlyStats = new Map<string, { views: number; date: string }>()

    for (const stat of dailyStats) {
      const date = new Date(stat.stat_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!monthlyStats.has(monthKey)) {
        monthlyStats.set(monthKey, { views: 0, date: stat.stat_date })
      }

      const monthData = monthlyStats.get(monthKey)!
      monthData.views += stat.views
    }

    const months = Array.from(monthlyStats.entries()).sort((a, b) => a[0].localeCompare(b[0]))

    // Find first month with 50,000+ views and 1000%+ increase
    for (let i = 1; i < months.length; i++) {
      const currentMonth = months[i][1]
      const previousMonth = months[i - 1][1]

      if (currentMonth.views >= 50000 && previousMonth.views > 0) {
        const increasePercent = ((currentMonth.views - previousMonth.views) / previousMonth.views) * 100

        if (increasePercent >= 1000) {
          return {
            date: currentMonth.date,
            views: currentMonth.views,
          }
        }
      }
    }

    return null
  }

  async getChannelsWithTakeoff(): Promise<string[]> {
    const channels = await this.getAllChannels()
    const takenOffChannels: string[] = []

    for (const channel of channels) {
      const dailyStats = await this.getChannelDailyStats(channel.channel_id, 365)
      const takeoffPoint = this.findTakeoffPoint(dailyStats)

      if (takeoffPoint) {
        takenOffChannels.push(channel.channel_id)
      }
    }

    return takenOffChannels
  }

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
