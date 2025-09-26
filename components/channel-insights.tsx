"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Users, Eye, Video, Target, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TimePeriod, ChannelAnalytics } from "@/lib/types"

interface ChannelInsightsProps {
  channelId?: string
}

export function ChannelInsights({ channelId }: ChannelInsightsProps) {
  const [channels, setChannels] = useState<any[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channelId || "")
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(30)
  const [analytics, setAnalytics] = useState<ChannelAnalytics | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)
  const [takeoffData, setTakeoffData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadChannels()
  }, [])

  useEffect(() => {
    if (selectedChannelId) {
      loadChannelData()
    }
  }, [selectedChannelId, selectedPeriod])

  const loadChannels = async () => {
    try {
      const response = await fetch("/api/channels")
      if (!response.ok) throw new Error("Failed to fetch channels")
      const channelData = await response.json()
      setChannels(channelData)
      if (!selectedChannelId && channelData.length > 0) {
        // Find the first channel with a valid channel_id
        const validChannel = channelData.find((channel: any) => 
          channel.channel_id && channel.channel_id.trim() !== ""
        )
        if (validChannel) {
          setSelectedChannelId(validChannel.channel_id)
        }
      }
    } catch (error) {
      console.error("Failed to load channels:", error)
    }
  }

  const loadChannelData = async () => {
    if (!selectedChannelId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/channels/insights?channelId=${selectedChannelId}&period=${selectedPeriod}`)
      if (!response.ok) throw new Error("Failed to fetch channel insights")

      const data = await response.json()
      setAnalytics(data.analytics)
      setPerformanceMetrics(data.metrics)
      setTakeoffData(data.takeoff)
    } catch (error) {
      console.error("Failed to load channel data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + "B"
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toLocaleString()
  }

  const formatPercentage = (percent: number) => {
    const sign = percent >= 0 ? "+" : ""
    return `${sign}${percent.toFixed(1)}%`
  }

  const getGrowthIcon = (percent: number) => {
    return percent >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    )
  }

  const getGrowthColor = (percent: number) => {
    return percent >= 0 ? "text-green-600" : "text-red-600"
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Channel Insights</h2>
          <p className="text-muted-foreground">Detailed analytics for individual channels</p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select channel" />
            </SelectTrigger>
            <SelectContent>
              {channels
                .filter((channel) => channel.channel_id && channel.channel_id.trim() !== "")
                .map((channel) => (
                  <SelectItem key={channel.channel_id} value={channel.channel_id}>
                    {channel.display_name || channel.channel_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedPeriod.toString()}
            onValueChange={(value) => setSelectedPeriod(Number(value) as TimePeriod)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 days</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="365">Last 1 year</SelectItem>
              <SelectItem value="1095">Last 3 years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {analytics && (
        <>
          {/* Channel Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage
                    src={analytics.channel.channel_thumbnail_url || "/placeholder.svg"}
                    alt={analytics.channel.channel_name}
                  />
                  <AvatarFallback>{analytics.channel.channel_name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground">{analytics.channel.channel_name}</h3>
                  <p className="text-muted-foreground">
                    {analytics.channel.channel_handle || analytics.channel.channel_name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {analytics.channel.channel_country && (
                      <Badge variant="outline" className="text-primary border-primary">
                        {analytics.channel.channel_country}
                      </Badge>
                    )}
                    {analytics.channel.channel_language && (
                      <Badge variant="outline">{analytics.channel.channel_language}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Subscribers</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatNumber(analytics.statistics.total_subscribers)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(analytics.growth.subscribersChangePercent)}
                      <span
                        className={`text-sm font-medium ${getGrowthColor(analytics.growth.subscribersChangePercent)}`}
                      >
                        {formatPercentage(analytics.growth.subscribersChangePercent)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({formatNumber(analytics.growth.subscribersChange)})
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatNumber(analytics.statistics.total_views)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(analytics.growth.viewsChangePercent)}
                      <span className={`text-sm font-medium ${getGrowthColor(analytics.growth.viewsChangePercent)}`}>
                        {formatPercentage(analytics.growth.viewsChangePercent)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({formatNumber(analytics.growth.viewsChange)})
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Eye className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Videos Uploaded</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.statistics.total_uploads}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm text-muted-foreground">Last {selectedPeriod} days</span>
                    </div>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Video className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          {performanceMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Views per Subscriber</span>
                      <span className="font-semibold text-foreground">
                        {analytics.growth.viewsPerSubscriber.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Daily Views</span>
                      <span className="font-semibold text-foreground">
                        {formatNumber(performanceMetrics.averageDailyViews)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Average Daily Subs Gained</span>
                      <span className="font-semibold text-foreground">
                        {formatNumber(performanceMetrics.averageDailySubsGained)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Views per Upload</span>
                      <span className="font-semibold text-foreground">
                        {formatNumber(performanceMetrics.viewsPerUpload)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Takeoff Analysis */}
              {takeoffData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Channel Growth Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Days to First Upload</span>
                        <span className="font-semibold text-foreground">{takeoffData.daysToFirstUpload} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Days to Takeoff</span>
                        <span className="font-semibold text-foreground">{takeoffData.daysToTakeoff} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Videos to Takeoff</span>
                        <span className="font-semibold text-foreground">{takeoffData.videosToTakeoff} videos</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Takeoff Date</span>
                          <span className="font-semibold text-foreground">
                            {new Date(takeoffData.takeoffDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {!analytics && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Select a channel to view detailed insights</p>
        </div>
      )}
    </div>
  )
}
