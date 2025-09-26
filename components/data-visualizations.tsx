"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GrowthChart } from "./charts/growth-chart"
import { NicheComparisonChart } from "./charts/niche-comparison-chart"
import { DailyActivityChart } from "./charts/daily-activity-chart"
import type { TimePeriod } from "@/lib/types"

export function DataVisualizations() {
  const [channels, setChannels] = useState<any[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>("")
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(30)
  const [channelData, setChannelData] = useState<any>(null)
  const [nicheData, setNicheData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
    try {
      const response = await fetch("/api/channels")
      if (!response.ok) throw new Error("Failed to fetch channels")
      const channelData = await response.json()
      setChannels(channelData)
      if (channelData.length > 0 && !selectedChannelId) {
        setSelectedChannelId(channelData[0].channel_id)
      }
    } catch (error) {
      console.error("Failed to load channels:", error)
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
    try {
      const response = await fetch(`/api/analytics/niche-comparison?period=${selectedPeriod}`)
      if (!response.ok) throw new Error("Failed to fetch niche data")
      const data = await response.json()
      setNicheData(data)
    } catch (error) {
      console.error("Failed to load niche data:", error)
    }
  }

  const selectedChannel = channels.find((c) => c.channel_id === selectedChannelId)

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channel">Channel Analysis</TabsTrigger>
          <TabsTrigger value="niches">Niche Comparison</TabsTrigger>
          <TabsTrigger value="activity">Daily Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {nicheData.length > 0 && (
              <>
                <NicheComparisonChart data={nicheData} title="Views by Niche" metric="views" />
                <NicheComparisonChart data={nicheData} title="Growth by Niche" metric="growth" />
              </>
            )}
          </div>

          {nicheData.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No data available for overview charts</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="channel" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.channel_id} value={channel.channel_id}>
                    {channel.display_name || channel.channel_name || "Unknown Channel"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-80 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

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
                {channels.map((channel) => (
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
