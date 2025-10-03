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
    
    // If we don't have enough daily stats, use growth data from insights
    let avgDailyViews = 0
    let avgDailySubsGained = 0
    
    if (dailyStats.length >= 2) {
      // Calculate daily changes from daily stats
      const dailyViewChanges = []
      const dailySubChanges = []

      for (let i = 1; i < dailyStats.length; i++) {
        dailyViewChanges.push(dailyStats[i].views - dailyStats[i - 1].views)
        dailySubChanges.push(dailyStats[i].subscribers - dailyStats[i - 1].subscribers)
      }

      avgDailyViews = dailyViewChanges.length > 0 ? dailyViewChanges.reduce((a, b) => a + b, 0) / dailyViewChanges.length : 0
      avgDailySubsGained = dailySubChanges.length > 0 ? dailySubChanges.reduce((a, b) => a + b, 0) / dailySubChanges.length : 0
    } else {
      // Fallback to growth data if daily stats are insufficient
      avgDailyViews = insights.growth.viewsChange / period
      avgDailySubsGained = insights.growth.subscribersChange / period
    }

    // Calculate views per subscriber using current statistics
    const viewsPerSubscriber = insights.statistics.total_subscribers > 0 
      ? insights.statistics.total_views / insights.statistics.total_subscribers 
      : 0

    return {
      averageDailyViews: Math.max(0, Math.round(avgDailyViews)),
      averageDailySubsGained: Math.max(0, Math.round(avgDailySubsGained)),
      totalUploadsInPeriod: insights.statistics.total_uploads || 0,
      viewsPerUpload: insights.statistics.total_uploads > 0 
        ? Math.round(insights.statistics.total_views / insights.statistics.total_uploads) 
        : 0,
      subsPerUpload: insights.statistics.total_uploads > 0
        ? Math.round(insights.statistics.total_subscribers / insights.statistics.total_uploads)
        : 0,
      engagementRate: Math.round(viewsPerSubscriber * 100) / 100, // Round to 2 decimal places
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
      // growthRate: Not available from SocialBlade API - would need historical data
      channelCount: stats.channelCount,
      averageViewsPerChannel: stats.totalViews / stats.channelCount,
      averageSubscribersPerChannel: stats.totalSubscribers / stats.channelCount,
      // viewsChangePercent: Not available from SocialBlade API - would need historical niche data
    }))
  }

  // Calculate time to takeoff based on real criteria:
  // Takeoff = 50,000+ views in a single month with 1000%+ increase from previous month
  static async calculateTimeToTakeoff(channelId: string) {
    // Fetch ALL available daily stats for this channel (no time limit)
    const allDailyStats = await databaseService.getChannelDailyStats(channelId, 9999) // Get all available data
    
    if (allDailyStats.length < 60) { // Need at least 2 months of data
      return {
        hasTakenOff: false,
        reason: "Insufficient data - need at least 2 months of daily statistics",
        daysToTakeoff: null,
        takeoffDate: null,
        monthlyViews: null,
        growthRate: null,
        totalDaysAnalyzed: allDailyStats.length
      }
    }

    // Get channel info for creation date
    const channel = await databaseService.getChannel(channelId)
    if (!channel) {
      return {
        hasTakenOff: false,
        reason: "Channel not found",
        daysToTakeoff: null,
        takeoffDate: null,
        monthlyViews: null,
        growthRate: null,
        totalDaysAnalyzed: allDailyStats.length
      }
    }

    // Sort by date to ensure chronological order (earliest first)
    const sortedStats = allDailyStats.sort((a, b) => new Date(a.stat_date).getTime() - new Date(b.stat_date).getTime())
    
    // Group data by month and calculate monthly view gains
    const monthlyData = this.groupStatsByMonth(sortedStats)
    
    if (monthlyData.length < 2) {
      return {
        hasTakenOff: false,
        reason: "Need at least 2 complete months of data",
        daysToTakeoff: null,
        takeoffDate: null,
        monthlyViews: null,
        growthRate: null,
        totalDaysAnalyzed: allDailyStats.length
      }
    }

    // Check each month for takeoff criteria - find the EARLIEST takeoff
    let earliestTakeoff = null
    
    for (let i = 1; i < monthlyData.length; i++) {
      const currentMonth = monthlyData[i]
      const previousMonth = monthlyData[i - 1]
      
      const monthlyViews = currentMonth.viewsGained
      const previousMonthViews = previousMonth.viewsGained
      
      // Calculate growth rate
      const growthRate = previousMonthViews > 0 
        ? ((monthlyViews - previousMonthViews) / previousMonthViews) * 100 
        : 0
      
      // Check takeoff criteria: 50k+ views AND 1000%+ growth
      if (monthlyViews >= 50000 && growthRate >= 1000) {
        const createdDate = channel.channel_created_date ? new Date(channel.channel_created_date) : new Date()
        const takeoffDate = new Date(currentMonth.year, currentMonth.month - 1, 1)
        const daysToTakeoff = Math.floor((takeoffDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        
        // This is the earliest takeoff we found, so save it and break
        earliestTakeoff = {
          hasTakenOff: true,
          daysToTakeoff,
          takeoffDate: takeoffDate.toISOString(),
          monthlyViews,
          growthRate: Math.round(growthRate),
          takeoffMonth: `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}`,
          totalDaysAnalyzed: allDailyStats.length
        }
        break // Stop at the first (earliest) takeoff
      }
    }

    if (earliestTakeoff) {
      return earliestTakeoff
    }

    return {
      hasTakenOff: false,
      reason: "Takeoff criteria not met (50k+ monthly views with 1000%+ growth)",
      daysToTakeoff: null,
      takeoffDate: null,
      monthlyViews: null,
      growthRate: null,
      totalDaysAnalyzed: allDailyStats.length
    }
  }

  // Helper function to group daily stats by month
  private static groupStatsByMonth(dailyStats: any[]) {
    const monthlyMap = new Map<string, { year: number; month: number; startViews: number; endViews: number; viewsGained: number }>()
    
    dailyStats.forEach(stat => {
      const date = new Date(stat.stat_date)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const key = `${year}-${month}`
      
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          year,
          month,
          startViews: stat.views,
          endViews: stat.views,
          viewsGained: 0
        })
      } else {
        const existing = monthlyMap.get(key)!
        existing.endViews = stat.views
        existing.viewsGained = existing.endViews - existing.startViews
      }
    })
    
    return Array.from(monthlyMap.values())
      .filter(month => month.viewsGained > 0) // Only include months with positive growth
      .sort((a, b) => a.year - b.year || a.month - b.month)
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
              prev.averageViewsPerSubscriber > current.averageViewsPerSubscriber ? prev : current,
            )
          : null,
      insights: enhancedInsights, // Use enhanced insights with display names
      nicheComparison,
    }
  }
}
