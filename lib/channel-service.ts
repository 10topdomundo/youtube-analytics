import type { Channel, ChannelDailyStats, TimePeriod } from "./types"
import { databaseService } from "./database-service"

export class ChannelService {
  // Get all channels
  static async getAllChannels(): Promise<Channel[]> {
    return await databaseService.getAllChannels()
  }

  // Get channel by ID
  static async getChannelById(channelId: string): Promise<Channel | null> {
    return await databaseService.getChannel(channelId)
  }

  // Add new channel
  static async addChannel(channelData: Omit<Channel, "id">): Promise<void> {
    await databaseService.addChannel(channelData as Channel)
  }

  // Update channel
  static async updateChannel(channelId: string, updates: Partial<Channel>): Promise<Channel | null> {
    await databaseService.updateChannel(channelId, updates)
    return await databaseService.getChannel(channelId)
  }

  // Delete channel
  static async deleteChannel(channelId: string): Promise<boolean> {
    try {
      await databaseService.deleteChannel(channelId)
      return true
    } catch (error) {
      console.error("Failed to delete channel:", error)
      return false
    }
  }

  // Get daily stats for a channel
  static async getChannelStats(channelId: string, days = 30): Promise<ChannelDailyStats[]> {
    return await databaseService.getChannelDailyStats(channelId, days)
  }

  // Get analytics for a channel
  static async getChannelAnalytics(channelId: string, period: TimePeriod = 30) {
    const analytics = await databaseService.getChannelAnalytics(channelId, period)
    if (!analytics) return null

    return {
      channel: analytics.channel,
      currentStats: {
        subscribers: analytics.statistics.total_subscribers,
        totalViews: analytics.statistics.total_views,
        uploadsCount: analytics.statistics.total_uploads,
      },
      growth: analytics.growth,
      dailyStats: analytics.dailyStats,
    }
  }

  // Get niche analytics - simplified implementation
  static async getNicheAnalytics(period: TimePeriod = 30) {
    const channels = await this.getAllChannels()
    const nicheStats = new Map<
      string,
      {
        totalViews: number
        totalSubscribers: number
        channelCount: number
        viewsChange: number
        subscribersChange: number
      }
    >()

    for (const channel of channels) {
      const analytics = await this.getChannelAnalytics(channel.channel_id, period)
      if (!analytics) continue

      // Use channel_country as niche for now
      const niche = channel.channel_country || "Unknown"
      const existing = nicheStats.get(niche) || {
        totalViews: 0,
        totalSubscribers: 0,
        channelCount: 0,
        viewsChange: 0,
        subscribersChange: 0,
      }

      nicheStats.set(niche, {
        totalViews: existing.totalViews + analytics.currentStats.totalViews,
        totalSubscribers: existing.totalSubscribers + analytics.currentStats.subscribers,
        channelCount: existing.channelCount + 1,
        viewsChange: existing.viewsChange + analytics.growth.viewsChange,
        subscribersChange: existing.subscribersChange + analytics.growth.subscribersChange,
      })
    }

    return Array.from(nicheStats.entries()).map(([niche, stats]) => ({
      niche,
      ...stats,
      viewsChangePercent: stats.totalViews > 0 ? (stats.viewsChange / (stats.totalViews - stats.viewsChange)) * 100 : 0,
      subscribersChangePercent:
        stats.totalSubscribers > 0
          ? (stats.subscribersChange / (stats.totalSubscribers - stats.subscribersChange)) * 100
          : 0,
    }))
  }

  // Fetch from SocialBlade - placeholder for real implementation
  static async fetchFromSocialBlade(channelId: string) {
    // This would integrate with real SocialBlade API
    throw new Error("SocialBlade integration not implemented yet")
  }
}
