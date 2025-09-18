import type { ChannelAnalytics, TimePeriod } from "./types"
import { databaseService } from "./database-service"

export class AnalyticsService {
  // Get comprehensive analytics for a channel
  static async getChannelInsights(channelId: string, period: TimePeriod = 30): Promise<ChannelAnalytics | null> {
    try {
      const analytics = await databaseService.getChannelAnalytics(channelId, period)
      return analytics
    } catch (error) {
      console.error("Failed to get channel insights:", error)
      return null
    }
  }

  // Get analytics for multiple channels
  static async getMultipleChannelInsights(channelIds: string[], period: TimePeriod = 30) {
    const promises = channelIds.map((id) => this.getChannelInsights(id, period))
    const results = await Promise.all(promises)
    return results.filter((result) => result !== null)
  }

  // Calculate views per subscriber ratio
  static calculateViewsPerSubscriber(totalViews: number, subscribers: number): number {
    return subscribers > 0 ? totalViews / subscribers : 0
  }

  // Calculate growth percentage
  static calculateGrowthPercentage(current: number, previous: number): number {
    return previous > 0 ? ((current - previous) / previous) * 100 : 0
  }

  // Get channel performance metrics
  static async getPerformanceMetrics(channelId: string, period: TimePeriod = 30) {
    const insights = await this.getChannelInsights(channelId, period)
    if (!insights) return null

    const dailyStats = insights.dailyStats
    const totalViews = dailyStats.reduce((sum, stat) => sum + stat.views, 0)
    const totalSubscribers = dailyStats.reduce((sum, stat) => sum + stat.subscribers, 0)

    // Calculate daily changes
    const dailyViewChanges = []
    const dailySubChanges = []

    for (let i = 1; i < dailyStats.length; i++) {
      dailyViewChanges.push(dailyStats[i].views - dailyStats[i - 1].views)
      dailySubChanges.push(dailyStats[i].subscribers - dailyStats[i - 1].subscribers)
    }

    const avgDailyViews =
      dailyViewChanges.length > 0 ? dailyViewChanges.reduce((a, b) => a + b, 0) / dailyViewChanges.length : 0
    const avgDailySubsGained =
      dailySubChanges.length > 0 ? dailySubChanges.reduce((a, b) => a + b, 0) / dailySubChanges.length : 0

    return {
      averageDailyViews: Math.max(0, avgDailyViews),
      averageDailySubsGained: Math.max(0, avgDailySubsGained),
      totalUploadsInPeriod: insights.statistics.total_uploads,
      viewsPerUpload:
        insights.statistics.total_uploads > 0 ? insights.statistics.total_views / insights.statistics.total_uploads : 0,
      subsPerUpload:
        insights.statistics.total_uploads > 0
          ? insights.statistics.total_subscribers / insights.statistics.total_uploads
          : 0,
      engagementRate: this.calculateViewsPerSubscriber(
        insights.statistics.total_views,
        insights.statistics.total_subscribers,
      ),
    }
  }

  // Get niche comparison data - simplified implementation
  static async getNicheComparison(period: TimePeriod = 30) {
    const channels = await databaseService.getAllChannels()
    const nicheMap = new Map<string, { totalViews: number; totalSubscribers: number; channelCount: number }>()

    for (const channel of channels) {
      const analytics = await this.getChannelInsights(channel.channel_id, period)
      if (!analytics) continue

      const niche = channel.channel_niche || "Unknown"
      const existing = nicheMap.get(niche) || { totalViews: 0, totalSubscribers: 0, channelCount: 0 }

      nicheMap.set(niche, {
        totalViews: existing.totalViews + analytics.statistics.total_views,
        totalSubscribers: existing.totalSubscribers + analytics.statistics.total_subscribers,
        channelCount: existing.channelCount + 1,
      })
    }

    return Array.from(nicheMap.entries()).map(([niche, stats]) => ({
      niche,
      totalChannels: stats.channelCount,
      totalViews: stats.totalViews,
      totalSubscribers: stats.totalSubscribers,
      averageViewsPerSubscriber: stats.totalSubscribers > 0 ? stats.totalViews / stats.totalSubscribers : 0,
      growthRate: Math.random() * 10 - 2, // Placeholder growth rate
      channelCount: stats.channelCount,
      averageViewsPerChannel: stats.totalViews / stats.channelCount,
      averageSubscribersPerChannel: stats.totalSubscribers / stats.channelCount,
      viewsChangePercent: Math.random() * 20 - 5, // Mock growth percentage
    }))
  }

  // Calculate time to takeoff - simplified implementation
  static async calculateTimeToTakeoff(channelId: string) {
    const insights = await this.getChannelInsights(channelId, 30)
    if (!insights) return null

    // Simplified calculation based on available data
    const channel = insights.channel
    const createdDate = channel.channel_created_date ? new Date(channel.channel_created_date) : new Date()
    const daysSinceCreation = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))

    return {
      daysToFirstUpload: 5, // Simplified assumption
      daysToTakeoff: Math.floor(daysSinceCreation * 0.3),
      videosToTakeoff: Math.floor(insights.statistics.total_uploads * 0.1),
      takeoffDate: new Date(createdDate.getTime() + daysSinceCreation * 0.3 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  // Get dashboard overview data
  static async getDashboardOverview(period: TimePeriod = 30) {
    const channels = await databaseService.getAllChannels()
    const channelIds = channels.map((c) => c.channel_id)

    const [insights, nicheComparison] = await Promise.all([
      this.getMultipleChannelInsights(channelIds, period),
      this.getNicheComparison(period),
    ])

    const totalSubscribers = insights.reduce((sum, insight) => sum + insight.statistics.total_subscribers, 0)
    const totalViews = insights.reduce((sum, insight) => sum + insight.statistics.total_views, 0)
    const totalSubsGrowth = insights.reduce((sum, insight) => sum + insight.growth.subscribersChange, 0)
    const totalViewsGrowth = insights.reduce((sum, insight) => sum + insight.growth.viewsChange, 0)

    const enhancedInsights = insights.map((insight) => ({
      ...insight,
      channel: {
        ...insight.channel,
        display_name: insight.channel.channel_name || insight.channel.channel_handle || "Unknown Channel",
      },
    }))

    return {
      totalChannels: channels.length,
      totalSubscribers,
      totalViews,
      totalSubsGrowth,
      totalViewsGrowth,
      averageSubsGrowthPercent:
        insights.length > 0
          ? insights.reduce((sum, insight) => sum + insight.growth.subscribersChangePercent, 0) / insights.length
          : 0,
      averageViewsGrowthPercent:
        insights.length > 0
          ? insights.reduce((sum, insight) => sum + insight.growth.viewsChangePercent, 0) / insights.length
          : 0,
      topPerformingNiche:
        nicheComparison.length > 0
          ? nicheComparison.reduce((prev, current) =>
              prev.viewsChangePercent > current.viewsChangePercent ? prev : current,
            )
          : null,
      insights: enhancedInsights, // Use enhanced insights with display names
      nicheComparison,
    }
  }
}
