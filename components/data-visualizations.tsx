"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { BarChart3, PieChart } from "lucide-react"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { GrowthChart } from "./charts/growth-chart"
import { NicheComparisonChart } from "./charts/niche-comparison-chart"
import { DailyActivityChart } from "./charts/daily-activity-chart"
import { LoadingSpinner, LoadingOverlay } from "@/components/ui/loading-spinner"
import type { TimePeriod } from "@/lib/types"

export function DataVisualizations() {
  const [channels, setChannels] = useState<any[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>("")
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(30)
  const [channelData, setChannelData] = useState<any>(null)
  const [nicheData, setNicheData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingChannels, setIsLoadingChannels] = useState(true)
  const [isLoadingNiche, setIsLoadingNiche] = useState(false)
  
  // Group analysis state
  const [groupAnalysisData, setGroupAnalysisData] = useState<any[]>([])
  const [selectedGroupBy, setSelectedGroupBy] = useState<string>("")
  const [selectedGroupMetric, setSelectedGroupMetric] = useState<string>("")
  const [selectedChartType, setSelectedChartType] = useState<string>("pie")
  const [groupChartData, setGroupChartData] = useState<any[]>([])
  const [isLoadingGroupData, setIsLoadingGroupData] = useState(false)

  useEffect(() => {
    loadChannels()
    loadNicheData()
  }, [])

  useEffect(() => {
    if (selectedChannelId) {
      loadChannelData()
    }
  }, [selectedChannelId, selectedPeriod])

  useEffect(() => {
    loadNicheData()
  }, [selectedPeriod])

  const loadChannels = async () => {
    setIsLoadingChannels(true)
    try {
      // Fetch all channels - use a large limit to get all channels for visualizations
      const response = await fetch("/api/channels?page=1&limit=1000")
      if (!response.ok) throw new Error("Failed to fetch channels")
      const data = await response.json()
      const channelData = data.channels || []
      setChannels(channelData)
      if (channelData.length > 0 && !selectedChannelId) {
        setSelectedChannelId(channelData[0].channel_id)
      }
    } catch (error) {
      console.error("Failed to load channels:", error)
    } finally {
      setIsLoadingChannels(false)
    }
  }

  const loadChannelData = async () => {
    if (!selectedChannelId) return

    setIsLoading(true)
    try {
      const [analyticsResponse, dailyStatsResponse] = await Promise.all([
        fetch(`/api/channels/${selectedChannelId}/insights?period=${selectedPeriod}`),
        fetch(`/api/channels/${selectedChannelId}/daily-stats?period=${selectedPeriod}`),
      ])

      if (!analyticsResponse.ok || !dailyStatsResponse.ok) {
        throw new Error("Failed to fetch channel data")
      }

      const [analytics, dailyStats] = await Promise.all([analyticsResponse.json(), dailyStatsResponse.json()])

      setChannelData({ analytics, stats: dailyStats })
    } catch (error) {
      console.error("Failed to load channel data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadNicheData = async () => {
    setIsLoadingNiche(true)
    try {
      const response = await fetch(`/api/analytics/niche-comparison?period=${selectedPeriod}`)
      if (!response.ok) throw new Error("Failed to fetch niche data")
      const data = await response.json()
      setNicheData(data)
    } catch (error) {
      console.error("Failed to load niche data:", error)
    } finally {
      setIsLoadingNiche(false)
    }
  }

  const selectedChannel = channels.find((c) => c.channel_id === selectedChannelId)

  // Group analysis functions
  const loadGroupAnalysisData = async () => {
    setIsLoadingGroupData(true)
    try {
      const response = await fetch("/api/channels/table-data")
      if (!response.ok) throw new Error("Failed to fetch group analysis data")
      const data = await response.json()
      setGroupAnalysisData(data)
    } catch (error) {
      console.error("Failed to load group analysis data:", error)
    } finally {
      setIsLoadingGroupData(false)
    }
  }

  const generateGroupChart = () => {
    if (!selectedGroupBy || !selectedGroupMetric || !groupAnalysisData.length) return

    const groupedData = groupAnalysisData.reduce((acc, channel) => {
      const groupKey = channel[selectedGroupBy] || "Unknown"
      if (!acc[groupKey]) {
        acc[groupKey] = []
      }
      acc[groupKey].push(channel)
      return acc
    }, {} as Record<string, any[]>)

    const chartData = Object.entries(groupedData).map(([groupName, channels], index) => {
      const colors = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316", "#84cc16"]
      
      let value = 0
      if (selectedGroupMetric === "count") {
        value = channels.length
      } else {
        // Calculate sum or average for numerical metrics
        const values = channels.map(ch => Number(ch[selectedGroupMetric]) || 0)
        value = selectedGroupMetric.includes("avg") || selectedGroupMetric.includes("per") 
          ? values.reduce((sum, v) => sum + v, 0) / values.length
          : values.reduce((sum, v) => sum + v, 0)
      }

      return {
        name: groupName,
        value: Math.round(value),
        color: colors[index % colors.length]
      }
    }).filter(item => item.value > 0)

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Data Visualizations</h2>
          <p className="text-muted-foreground">Interactive charts and analytics</p>
        </div>

        <div className="flex items-center gap-4">
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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channel">Channel Analysis</TabsTrigger>
          <TabsTrigger value="group">Group Analysis</TabsTrigger>
          <TabsTrigger value="niches">Niche Comparison</TabsTrigger>
          <TabsTrigger value="activity">Daily Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <LoadingOverlay isLoading={isLoadingNiche} text="Loading niche data...">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {nicheData.length > 0 && (
                <>
                  <NicheComparisonChart data={nicheData} title="Views by Niche" metric="views" />
                  <NicheComparisonChart data={nicheData} title="Growth by Niche" metric="growth" />
                </>
              )}
            </div>

            {nicheData.length === 0 && !isLoadingNiche && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No data available for overview charts</p>
                </CardContent>
              </Card>
            )}
          </LoadingOverlay>
        </TabsContent>

        <TabsContent value="channel" className="space-y-6">
          <LoadingOverlay isLoading={isLoadingChannels} text="Loading channels...">
            <div className="flex items-center gap-4 mb-6">
              <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels
                    .filter(channel => channel.channel_id && channel.channel_id.trim() !== '')
                    .map((channel) => (
                      <SelectItem key={channel.channel_id} value={channel.channel_id}>
                        {channel.display_name || channel.channel_name || "Unknown Channel"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </LoadingOverlay>

          <LoadingOverlay isLoading={isLoading} text="Loading channel data...">
            {channelData && !isLoading && (
              <div className="space-y-6">
                <GrowthChart
                data={channelData.stats}
                title={`Growth Trends - ${selectedChannel?.display_name || selectedChannel?.channel_name || "Unknown Channel"}`}
              />
              <DailyActivityChart
                data={channelData.stats}
                title={`Daily Activity - ${selectedChannel?.display_name || selectedChannel?.channel_name || "Unknown Channel"}`}
              />
            </div>
          )}

          {!channelData && !isLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Select a channel to view detailed charts</p>
              </CardContent>
            </Card>
          )}
          </LoadingOverlay>
        </TabsContent>

        <TabsContent value="group" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Group Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <Label>Chart Type</Label>
                  <Select value={selectedChartType} onValueChange={setSelectedChartType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button 
                    onClick={() => {
                      loadGroupAnalysisData().then(() => generateGroupChart())
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
                  
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      {selectedChartType === "pie" ? (
                        <RechartsPieChart>
                          <Pie
                            data={groupChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={140}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                          >
                            {groupChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [formatNumber(Number(value)), name]} />
                          <Legend />
                        </RechartsPieChart>
                      ) : (
                        <BarChart data={groupChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            interval={0}
                          />
                          <YAxis tickFormatter={formatNumber} />
                          <Tooltip formatter={(value, name) => [formatNumber(Number(value)), name]} />
                          <Bar dataKey="value" fill="#10b981" />
                        </BarChart>
                      )}
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
                <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <PieChart className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">No data available for the selected grouping</p>
                  <p className="text-sm text-muted-foreground/60 mt-2">Try a different combination of grouping and metric</p>
                </div>
              )}

              {(!selectedGroupBy || !selectedGroupMetric) && (
                <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <BarChart3 className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">Select grouping and metric to generate charts</p>
                  <p className="text-sm text-muted-foreground/60 mt-2">Choose how to group your channels and what metric to analyze</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="niches" className="space-y-6">
          {nicheData.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              <NicheComparisonChart data={nicheData} title="Total Views by Niche" metric="views" />
              <NicheComparisonChart data={nicheData} title="Total Subscribers by Niche" metric="subscribers" />
              <NicheComparisonChart data={nicheData} title="Growth Rates by Niche" metric="growth" />
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No niche data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {channels
                  .filter(channel => channel.channel_id && channel.channel_id.trim() !== '')
                  .map((channel) => (
                    <SelectItem key={channel.channel_id} value={channel.channel_id}>
                      {channel.display_name || channel.channel_name || "Unknown Channel"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {channelData && !isLoading && (
            <DailyActivityChart
              data={channelData.stats}
              title={`Daily Activity - ${selectedChannel?.display_name || selectedChannel?.channel_name || "Unknown Channel"}`}
            />
          )}

          {!channelData && !isLoading && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Select a channel to view daily activity</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
