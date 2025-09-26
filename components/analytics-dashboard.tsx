"use client"

import { useState, useEffect } from "react"
import { Calendar, TrendingUp, TrendingDown, Users, Eye, Video, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TimePeriod } from "@/lib/types"

interface DashboardOverview {
  totalChannels: number
  totalSubscribers: number
  totalViews: number
  totalSubsGrowth: number
  totalViewsGrowth: number
  averageSubsGrowthPercent: number
  averageViewsGrowthPercent: number
  topPerformingNiche: any
  insights: any[]
  nicheComparison: any[]
}

export function AnalyticsDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(30)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [selectedPeriod])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/dashboard?period=${selectedPeriod}`)
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }
      const data = await response.json()
      setOverview(data)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num == null || num === undefined) {
      return "0"
    }
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
    if (percent == null || percent === undefined) {
      return "0.0%"
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive YouTube channel analytics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
        <Button onClick={loadDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive YouTube channel analytics</p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Channels</p>
                <p className="text-2xl font-bold text-foreground">{overview.totalChannels}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Video className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Subscribers</p>
                <p className="text-2xl font-bold text-foreground">{formatNumber(overview.totalSubscribers)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(overview.averageSubsGrowthPercent)}
                  <span className={`text-sm font-medium ${getGrowthColor(overview.averageSubsGrowthPercent)}`}>
                    {formatPercentage(overview.averageSubsGrowthPercent)}
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
                <p className="text-2xl font-bold text-foreground">{formatNumber(overview.totalViews)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(overview.averageViewsGrowthPercent)}
                  <span className={`text-sm font-medium ${getGrowthColor(overview.averageViewsGrowthPercent)}`}>
                    {formatPercentage(overview.averageViewsGrowthPercent)}
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
                <p className="text-sm font-medium text-muted-foreground">Top Niche</p>
                <p className="text-2xl font-bold text-foreground">{overview.topPerformingNiche?.niche || "N/A"}</p>
                {overview.topPerformingNiche && (
                  <div className="flex items-center gap-1 mt-1">
                    {getGrowthIcon(overview.topPerformingNiche.viewsChangePercent)}
                    <span
                      className={`text-sm font-medium ${getGrowthColor(overview.topPerformingNiche.viewsChangePercent)}`}
                    >
                      {formatPercentage(overview.topPerformingNiche.viewsChangePercent)}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="channels">Channel Performance</TabsTrigger>
          <TabsTrigger value="niches">Niche Analysis</TabsTrigger>
          <TabsTrigger value="insights">Growth Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overview.insights.map((insight, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Video className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{insight.channel.display_name}</h3>
                        <p className="text-sm text-muted-foreground">{insight.channel.channel_type}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Subscribers</p>
                          <p className="font-semibold">{formatNumber(insight.statistics.subscribers)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Views</p>
                          <p className="font-semibold">{formatNumber(insight.statistics.views)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Growth</p>
                          <div className="flex items-center gap-1">
                            {getGrowthIcon(insight.growth.subscribersChangePercent)}
                            <span
                              className={`text-sm font-medium ${getGrowthColor(insight.growth.subscribersChangePercent)}`}
                            >
                              {formatPercentage(insight.growth.subscribersChangePercent)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="niches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Niche Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overview.nicheComparison.map((niche, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">{niche.niche}</h3>
                          <Badge variant="outline" className="text-primary border-primary">
                            {niche.totalChannels} channels
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Views</span>
                            <span className="font-medium">{formatNumber(niche.totalViews)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Subscribers</span>
                            <span className="font-medium">{formatNumber(niche.totalSubscribers)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Avg Views/Channel</span>
                            <span className="font-medium">{formatNumber(niche.averageViewsPerChannel)}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Growth</span>
                            <div className="flex items-center gap-1">
                              {getGrowthIcon(niche.viewsChangePercent)}
                              <span className={`text-sm font-medium ${getGrowthColor(niche.viewsChangePercent)}`}>
                                {formatPercentage(niche.viewsChangePercent)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Growth Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Subscriber Growth</span>
                    <span className={`font-semibold ${getGrowthColor(overview.averageSubsGrowthPercent)}`}>
                      {formatPercentage(overview.averageSubsGrowthPercent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average View Growth</span>
                    <span className={`font-semibold ${getGrowthColor(overview.averageViewsGrowthPercent)}`}>
                      {formatPercentage(overview.averageViewsGrowthPercent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Subscriber Gain</span>
                    <span className="font-semibold text-foreground">{formatNumber(overview.totalSubsGrowth)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total View Increase</span>
                    <span className="font-semibold text-foreground">{formatNumber(overview.totalViewsGrowth)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Views per Subscriber</span>
                    <span className="font-semibold text-foreground">
                      {(overview.totalViews / overview.totalSubscribers).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Best Performing Niche</span>
                    <Badge variant="outline" className="text-primary border-primary">
                      {overview.topPerformingNiche?.niche || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Channels Tracked</span>
                    <span className="font-semibold text-foreground">{overview.totalChannels}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Period</span>
                    <Badge variant="outline">Last {selectedPeriod} days</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
