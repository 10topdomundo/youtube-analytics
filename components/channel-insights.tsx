"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Users, Eye, Video, Target, Clock, BarChart3, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { TimePeriod, ChannelAnalytics } from "@/lib/types"

interface ChannelInsightsProps {
  channelId?: string
}

export function ChannelInsights({ channelId }: ChannelInsightsProps) {
  const [channels, setChannels] = useState<any[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>(channelId || "")
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(30)
  const [selectedNiche, setSelectedNiche] = useState<string>("all")
  const [analytics, setAnalytics] = useState<ChannelAnalytics | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null)
  const [takeoffData, setTakeoffData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Group analysis state
  const [groupAnalysisData, setGroupAnalysisData] = useState<any[]>([])
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>("")
  const [selectedGroupMetric, setSelectedGroupMetric] = useState<string>("")
  const [groupChartData, setGroupChartData] = useState<any[]>([])
  const [isLoadingGroupData, setIsLoadingGroupData] = useState(false)

  useEffect(() => {
    loadChannels()
  }, [])

  useEffect(() => {
    if (selectedChannelId) {
      loadChannelData()
    }
  }, [selectedChannelId, selectedPeriod])

  useEffect(() => {
    // Reset selected channel when niche filter changes
    const filteredChannels = getFilteredChannels()
    if (selectedChannelId && !filteredChannels.find(c => c.channel_id === selectedChannelId)) {
      setSelectedChannelId("")
    }
  }, [selectedNiche, channels])

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

  const getUniqueNiches = () => {
    const niches = channels.map(channel => channel.channel_niche || channel.niche).filter(Boolean)
    return [...new Set(niches)].sort()
  }

  const getFilteredChannels = () => {
    if (selectedNiche === "all") {
      return channels.filter((channel) => channel.channel_id && channel.channel_id.trim() !== "")
    }
    return channels.filter((channel) => 
      channel.channel_id && 
      channel.channel_id.trim() !== "" &&
      (channel.channel_niche === selectedNiche || channel.niche === selectedNiche)
    )
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

  // Group analysis functions
  const loadGroupAnalysisData = async () => {
    setIsLoadingGroupData(true)
    try {
      const response = await fetch("/api/channels/table-data")
      if (!response.ok) throw new Error("Failed to fetch group analysis data")
      const data = await response.json()
      setGroupAnalysisData(data)
      return data // Return the data for immediate use
    } catch (error) {
      console.error("Failed to load group analysis data:", error)
      return []
    } finally {
      setIsLoadingGroupData(false)
    }
  }

  const generateGroupChart = (data?: any[]) => {
    const dataToUse = data || groupAnalysisData
    if (!selectedGroupBy || !selectedGroupMetric || !dataToUse.length) {
      console.log("Cannot generate chart:", { selectedGroupBy, selectedGroupMetric, dataLength: dataToUse.length })
      return
    }

    const groupedData = dataToUse.reduce((acc, channel) => {
      const groupKey = channel[selectedGroupBy] || "Unknown"
      if (!acc[groupKey]) {
        acc[groupKey] = []
      }
      acc[groupKey].push(channel)
      return acc
    }, {} as Record<string, any[]>)

    // Sort entries by group name for consistent color assignment
    const sortedEntries = Object.entries(groupedData).sort(([a], [b]) => a.localeCompare(b))
    
    const chartData = sortedEntries.map(([groupName, channels], index) => {
      const colors = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316", "#84cc16"]
      
      let value = 0
      if (selectedGroupMetric === "count") {
        value = (channels as any[]).length
      } else {
        // Calculate sum or average for numerical metrics
        const values = (channels as any[]).map((ch: any) => Number(ch[selectedGroupMetric]) || 0)
        value = selectedGroupMetric.includes("avg") || selectedGroupMetric.includes("per") 
          ? values.reduce((sum: number, v: number) => sum + v, 0) / values.length
          : values.reduce((sum: number, v: number) => sum + v, 0)
      }

      return {
        name: groupName,
        value: Math.round(value),
        color: colors[index % colors.length]
      }
    }).filter(item => item.value > 0)

    // Sort by value descending for better visual representation
    chartData.sort((a, b) => b.value - a.value)
    
    console.log("Generated chart data:", chartData)
    setGroupChartData(chartData)
  }

  // Available grouping options
  const groupByOptions = [
    { value: "niche", label: "Niche" },
    { value: "thumbnail_style", label: "Thumbnail Style" },
    { value: "video_style", label: "Video Style" },
    { value: "channel_type", label: "Channel Type" },
    { value: "video_length", label: "Video Length" },
    { value: "language", label: "Language" }
  ]

  // Available metrics for group analysis
  const groupMetricOptions = [
    { value: "count", label: "Channel Count" },
    { value: "total_subscribers", label: "Total Subscribers" },
    { value: "total_views", label: "Total Views" },
    { value: "views_last_30_days", label: "Views Last 30 Days" },
    { value: "views_per_subscriber", label: "Avg Views per Subscriber" }
  ]

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
          <Select value={selectedNiche} onValueChange={setSelectedNiche}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All niches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All niches</SelectItem>
              {getUniqueNiches().map((niche) => (
                <SelectItem key={niche} value={niche}>
                  {niche}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select channel" />
            </SelectTrigger>
            <SelectContent>
              {getFilteredChannels().map((channel) => (
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
                      {formatNumber(analytics.dailyStats[analytics.dailyStats.length - 1]?.subscribers || analytics.statistics.total_subscribers)}
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
                      <span className="text-sm text-muted-foreground ml-1">
                        last {analytics.growth.period} days
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
                      {formatNumber(analytics.dailyStats[analytics.dailyStats.length - 1]?.views || analytics.statistics.total_views)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {getGrowthIcon(analytics.growth.viewsChangePercent)}
                      <span className={`text-sm font-medium ${getGrowthColor(analytics.growth.viewsChangePercent)}`}>
                        {formatPercentage(analytics.growth.viewsChangePercent)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({formatNumber(analytics.growth.viewsChange)})
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">
                        last {analytics.growth.period} days
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
                    <p className="text-sm font-medium text-muted-foreground">Total Videos Uploaded</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.statistics.total_uploads}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm text-muted-foreground">Lifetime total</span>
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
                    {/* Average Videos per Day removed - SocialBlade doesn't provide upload frequency data */}
                  </div>
                </CardContent>
              </Card>

              {/* Takeoff Analysis */}
              {takeoffData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Takeoff Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {takeoffData.hasTakenOff ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-green-800">Channel has taken off!</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Days to Takeoff</span>
                          <span className="font-semibold text-foreground">{takeoffData.daysToTakeoff} days</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Takeoff Month Views</span>
                          <span className="font-semibold text-foreground">{takeoffData.monthlyViews?.toLocaleString()} views</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Growth Rate</span>
                          <span className="font-semibold text-green-600">+{takeoffData.growthRate}%</span>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Takeoff Date</span>
                            <span className="font-semibold text-foreground">
                              {new Date(takeoffData.takeoffDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-muted-foreground">Data Analyzed</span>
                            <span className="text-sm text-muted-foreground">{takeoffData.totalDaysAnalyzed} days</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-sm font-medium text-orange-800">No takeoff detected</span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                          <strong>Takeoff Criteria:</strong> 50,000+ views in a single month with 1000%+ growth from previous month
                          <br />
                          <strong>Data Analyzed:</strong> {takeoffData.totalDaysAnalyzed} days of history
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <strong>Reason:</strong> {takeoffData.reason}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Group Analysis Section */}
          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Group Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Group By</Label>
                    <Select value={selectedGroupBy} onValueChange={setSelectedGroupBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grouping..." />
                      </SelectTrigger>
                      <SelectContent>
                        {groupByOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Metric</Label>
                    <Select value={selectedGroupMetric} onValueChange={setSelectedGroupMetric}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select metric..." />
                      </SelectTrigger>
                      <SelectContent>
                        {groupMetricOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button 
                      onClick={async () => {
                        const data = await loadGroupAnalysisData()
                        generateGroupChart(data)
                      }}
                      disabled={!selectedGroupBy || !selectedGroupMetric || isLoadingGroupData}
                      className="w-full"
                    >
                      {isLoadingGroupData ? "Loading..." : "Generate Chart"}
                    </Button>
                  </div>
                </div>

                {/* Chart Display */}
                {groupChartData.length > 0 && (
                  <div className="bg-muted/30 p-6 rounded-lg">
                    <h4 className="font-semibold mb-4 text-center">
                      {groupMetricOptions.find(m => m.value === selectedGroupMetric)?.label} by {groupByOptions.find(g => g.value === selectedGroupBy)?.label}
                    </h4>
                    
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={groupChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={120}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                          >
                            {groupChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any, name: any) => [formatNumber(Number(value)), name]} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Chart Summary */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {groupChartData.slice(0, 4).map((item, index) => (
                        <div key={index} className="text-center p-3 bg-background rounded-lg border">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-semibold">{formatNumber(item.value)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedGroupBy && selectedGroupMetric && groupChartData.length === 0 && !isLoadingGroupData && (
                  <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                    <PieChart className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">No data available for the selected grouping</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
