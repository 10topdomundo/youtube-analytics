"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { TrendingUp, Users, Eye, Play, Crown } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface NichePerformanceData {
  niche: string
  totalChannels: number
  totalSubscribers: number
  totalViews: number
  recentViews: number // Views for selected period (30 or 7 days)
  totalUploads: number
  avgViewsPerChannel: number
  avgSubscribersPerChannel: number
  avgViewsPerSubscriber: number
  avgRecentViewsPerChannel: number
  rank: number
}

export function TopNichesDashboard() {
  const [nicheData, setNicheData] = useState<NichePerformanceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<string>("30")

  useEffect(() => {
    loadNicheData()
  }, [timePeriod])

  const loadNicheData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/channels/table-data?period=${timePeriod}`)
      if (!response.ok) {
        throw new Error("Failed to fetch channel data")
      }
      
      const channels = await response.json()
      processNicheData(channels)
    } catch (error) {
      console.error("Failed to load niche data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const processNicheData = (channels: any[]) => {
    // Group channels by niche
    const nicheGroups = new Map<string, any[]>()
    
    channels.forEach(channel => {
      const niche = channel.niche || "Uncategorized"
      if (!nicheGroups.has(niche)) {
        nicheGroups.set(niche, [])
      }
      nicheGroups.get(niche)!.push(channel)
    })

    // Calculate performance metrics for each niche
    const nicheMetrics: NichePerformanceData[] = []
    
    nicheGroups.forEach((channelList, niche) => {
      const totalChannels = channelList.length
      const totalSubscribers = channelList.reduce((sum, ch) => sum + (ch.total_subscribers || 0), 0)
      const totalViews = channelList.reduce((sum, ch) => sum + (ch.total_views || 0), 0)
      const recentViews = channelList.reduce((sum, ch) => sum + (ch.views_last_30_days || ch.views_last_7_days || 0), 0)
      const totalUploads = channelList.reduce((sum, ch) => sum + (ch.total_uploads || 0), 0)
      
      const avgViewsPerChannel = totalChannels > 0 ? totalViews / totalChannels : 0
      const avgSubscribersPerChannel = totalChannels > 0 ? totalSubscribers / totalChannels : 0
      const avgViewsPerSubscriber = totalSubscribers > 0 ? totalViews / totalSubscribers : 0
      const avgRecentViewsPerChannel = totalChannels > 0 ? recentViews / totalChannels : 0

      nicheMetrics.push({
        niche,
        totalChannels,
        totalSubscribers,
        totalViews,
        recentViews,
        totalUploads,
        avgViewsPerChannel,
        avgSubscribersPerChannel,
        avgViewsPerSubscriber,
        avgRecentViewsPerChannel,
        rank: 0 // Will be set after sorting
      })
    })

    // Sort by recent views instead of total views
    nicheMetrics.sort((a, b) => b.recentViews - a.recentViews)
    nicheMetrics.forEach((niche, index) => {
      niche.rank = index + 1
    })

    // Take top 5
    setNicheData(nicheMetrics.slice(0, 5))
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
    return num.toFixed(0)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Crown className="w-5 h-5 text-gray-400" />
      case 3:
        return <Crown className="w-5 h-5 text-amber-600" />
      default:
        return <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{rank}</div>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-yellow-500 bg-yellow-50"
      case 2:
        return "border-gray-400 bg-gray-50"
      case 3:
        return "border-amber-600 bg-amber-50"
      default:
        return "border-muted"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Crown className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Top 5 Performing Niches</h1>
        </div>
        
        <div className="grid gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-muted rounded w-1/3"></div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Crown className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Top 5 Performing Niches</h1>
          <Badge variant="secondary" className="ml-2">
            Ranked by Recent Views
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Label>Time Period:</Label>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top 5 Niche Cards */}
      <div className="space-y-4">
        {nicheData.map((niche) => (
          <Card key={niche.niche} className={`border-2 ${getRankColor(niche.rank)} transition-all hover:shadow-lg`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRankIcon(niche.rank)}
                  <div>
                    <CardTitle className="text-xl">{niche.niche}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Rank #{niche.rank} • {niche.totalChannels} channels
                    </p>
                  </div>
                </div>
                <Badge variant={niche.rank <= 3 ? "default" : "secondary"} className="text-lg px-3 py-1">
                  #{niche.rank}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatNumber(niche.recentViews)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Recent Views ({timePeriod} days)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatNumber(niche.totalSubscribers)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Subscribers</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Play className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatNumber(niche.totalUploads)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Videos</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {niche.avgViewsPerSubscriber.toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Views/Sub</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-muted">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Avg Views per Channel:</span>
                    <span className="ml-2 font-semibold">{formatNumber(niche.avgViewsPerChannel)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Subscribers per Channel:</span>
                    <span className="ml-2 font-semibold">{formatNumber(niche.avgSubscribersPerChannel)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={nicheData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="niche" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: any, name: string) => [formatNumber(value), name]}
                labelFormatter={(label) => `Niche: ${label}`}
              />
              <Legend />
              <Bar dataKey="totalViews" fill="#3b82f6" name="Total Views" />
              <Bar dataKey="totalSubscribers" fill="#10b981" name="Total Subscribers" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {nicheData.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Crown className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Niche Data Available</h3>
            <p className="text-muted-foreground">
              Add some channels to see top performing niches.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}





