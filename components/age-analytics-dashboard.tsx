"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, TrendingUp, Users, Eye, Play } from "lucide-react"

interface Channel {
  id: string
  channel_id: string
  channel_name: string
  channel_niche?: string
  total_subscribers?: number
  total_views?: number
  total_uploads?: number
  channel_created_date?: string
  creation_year?: number
  age_classification?: string
}

interface NicheAgeData {
  niche: string
  fresh: number
  aged: number
  total: number
  freshPercent: number
  agedPercent: number
}

interface PieChartData {
  name: string
  value: number
  color: string
  [key: string]: any // Add index signature for Recharts compatibility
}

const AGE_COLORS = {
  fresh: "#10b981", // Green
  aged: "#f59e0b",  // Orange
}

const NICHE_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
]

export function AgeAnalyticsDashboard() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [nicheAgeData, setNicheAgeData] = useState<NicheAgeData[]>([])
  const [selectedNiche, setSelectedNiche] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [overallStats, setOverallStats] = useState({
    totalChannels: 0,
    freshCount: 0,
    agedCount: 0,
    freshPercent: 0,
    agedPercent: 0,
  })

  useEffect(() => {
    loadChannels()
  }, [])

  useEffect(() => {
    if (channels.length > 0) {
      processAgeData()
    }
  }, [channels])

  const loadChannels = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/channels")
      if (!response.ok) throw new Error("Failed to fetch channels")
      
      const channelData = await response.json()
      
      // Process channels to add age classification
      const processedChannels = channelData.map((channel: any) => {
        const creationYear = channel.channel_created_date 
          ? new Date(channel.channel_created_date).getFullYear()
          : null
        
        let ageClassification = "unknown"
        if (creationYear) {
        if (creationYear >= 2023) {
          ageClassification = "fresh"
        } else if (creationYear <= 2022) {
          ageClassification = "aged"
          }
        }
        
        return {
          ...channel,
          creation_year: creationYear,
          age_classification: ageClassification
        }
      })
      
      setChannels(processedChannels)
    } catch (error) {
      console.error("Failed to load channels:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const processAgeData = () => {
    // Group channels by niche
    const nicheGroups = new Map<string, Channel[]>()
    
    channels.forEach(channel => {
      const niche = channel.channel_niche || "Uncategorized"
      if (!nicheGroups.has(niche)) {
        nicheGroups.set(niche, [])
      }
      nicheGroups.get(niche)!.push(channel)
    })
    
    // Calculate age distribution for each niche
    const nicheData: NicheAgeData[] = []
    
    nicheGroups.forEach((channelList, niche) => {
      const fresh = channelList.filter(c => c.age_classification === "fresh").length
      const aged = channelList.filter(c => c.age_classification === "aged").length
      const total = fresh + aged
      
      if (total > 0) {
        nicheData.push({
          niche,
          fresh,
          aged,
          total,
          freshPercent: (fresh / total) * 100,
          agedPercent: (aged / total) * 100,
        })
      }
    })
    
    // Sort by total channels
    nicheData.sort((a, b) => b.total - a.total)
    setNicheAgeData(nicheData)
    
    // Calculate overall stats
    const totalChannels = channels.length
    const freshCount = channels.filter(c => c.age_classification === "fresh").length
    const agedCount = channels.filter(c => c.age_classification === "aged").length
    
    setOverallStats({
      totalChannels,
      freshCount,
      agedCount,
      freshPercent: totalChannels > 0 ? (freshCount / totalChannels) * 100 : 0,
      agedPercent: totalChannels > 0 ? (agedCount / totalChannels) * 100 : 0,
    })
  }

  const getOverallPieData = (): PieChartData[] => [
    { name: "Fresh (2023+)", value: overallStats.freshCount, color: AGE_COLORS.fresh },
    { name: "Aged (2022-)", value: overallStats.agedCount, color: AGE_COLORS.aged },
  ].filter(item => item.value > 0)

  const getNichePieData = (): PieChartData[] => {
    if (selectedNiche === "all") {
      return nicheAgeData.map((niche, index) => ({
        name: niche.niche,
        value: niche.total,
        color: NICHE_COLORS[index % NICHE_COLORS.length]
      }))
    } else {
      const nicheData = nicheAgeData.find(n => n.niche === selectedNiche)
      if (!nicheData) return []
      
      return [
        { name: "Fresh (2023+)", value: nicheData.fresh, color: AGE_COLORS.fresh },
        { name: "Aged (2022-)", value: nicheData.aged, color: AGE_COLORS.aged },
      ].filter(item => item.value > 0).filter(item => item.value > 0)
    }
  }

  const getBarChartData = () => {
    return nicheAgeData.map(niche => ({
      niche: niche.niche.length > 10 ? niche.niche.substring(0, 10) + "..." : niche.niche,
      fullNiche: niche.niche,
      Fresh: niche.fresh,
      Aged: niche.aged,
      Total: niche.total
    }))
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{payload[0]?.payload?.fullNiche || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Age Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Channel distribution by creation date and niche
          </p>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{overallStats.totalChannels}</p>
                <p className="text-sm text-muted-foreground">Total Channels</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{overallStats.freshCount}</p>
                <p className="text-sm text-muted-foreground">
                  Fresh ({overallStats.freshPercent.toFixed(1)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{overallStats.agedCount}</p>
                <p className="text-sm text-muted-foreground">
                  Aged ({overallStats.agedPercent.toFixed(1)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-niche">By Niche</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Age Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getOverallPieData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getOverallPieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Niche Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Channels by Niche</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getNichePieData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getNichePieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="by-niche" className="space-y-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium">Select Niche:</label>
            <Select value={selectedNiche} onValueChange={setSelectedNiche}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Niches</SelectItem>
                {nicheAgeData.map(niche => (
                  <SelectItem key={niche.niche} value={niche.niche}>
                    {niche.niche} ({niche.total})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Selected Niche Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedNiche === "all" ? "All Niches" : selectedNiche} - Age Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getNichePieData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${((percent as number) * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getNichePieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Niche Details */}
            <Card>
              <CardHeader>
                <CardTitle>Niche Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nicheAgeData.slice(0, 8).map((niche, index) => (
                    <div key={niche.niche} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{niche.niche}</span>
                        <Badge variant="outline">{niche.total} channels</Badge>
                      </div>
                      <div className="flex h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="bg-green-500"
                          style={{ width: `${niche.freshPercent}%` }}
                        />
                        <div 
                          className="bg-orange-500"
                          style={{ width: `${niche.agedPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{niche.fresh} Fresh</span>
                        <span>{niche.aged} Aged</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution by Niche (Bar Chart)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getBarChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="niche" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Fresh" fill={AGE_COLORS.fresh} />
                  <Bar dataKey="Aged" fill={AGE_COLORS.aged} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Niche</th>
                      <th className="text-right p-2">Total</th>
                      <th className="text-right p-2">Fresh</th>
                      <th className="text-right p-2">Aged</th>
                      <th className="text-right p-2">Fresh %</th>
                      <th className="text-right p-2">Aged %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nicheAgeData.map((niche) => (
                      <tr key={niche.niche} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{niche.niche}</td>
                        <td className="p-2 text-right">{niche.total}</td>
                        <td className="p-2 text-right text-green-600">{niche.fresh}</td>
                        <td className="p-2 text-right text-orange-600">{niche.aged}</td>
                        <td className="p-2 text-right">{niche.freshPercent.toFixed(1)}%</td>
                        <td className="p-2 text-right">{niche.agedPercent.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

