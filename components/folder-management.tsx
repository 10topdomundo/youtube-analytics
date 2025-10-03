"use client"

import { useState, useEffect } from "react"
import { Folder, Plus, Edit2, Trash2, FolderOpen, Search, Filter, ExternalLink, Users, TrendingUp, Calendar, Eye, BarChart3, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

interface Channel {
  id: string
  channel_id: string
  channel_name: string
  channel_niche?: string
  channel_thumbnail_url?: string
  total_subscribers?: number
  total_views?: number
  channel_created_date?: string
  creation_year?: number
  age_classification?: string
  channel_country?: string
}

interface FolderStats {
  name: string
  count: number
  color: string
  channels: Channel[]
  freshCount: number // 2023+
  agedCount: number  // 2022-
}

interface FolderManagementProps {
  isAdmin?: boolean
}

interface ChartData {
  name: string
  value: number
  color?: string
  [key: string]: any // Add index signature for Recharts compatibility
}

interface ChannelTableData {
  id: string
  channel_id: string
  channel_name: string
  niche: string
  language: string
  views_last_30_days: number
  views_delta_30_days: string
  views_delta_7_days: string
  views_delta_3_days: string
  views_per_subscriber: number
  sub_niche: string
  channel_type: string
  channel_creation: string
  thumbnail_style: string
  video_style: string
  video_length: string
  status: string
  notes: string
  total_subscribers: number
  total_views: number
  total_uploads: number
  [key: string]: any
}

const PREDEFINED_NICHES = [
  { name: "Facts", color: "#10b981" },
  { name: "History", color: "#f59e0b" },
  { name: "Comedy", color: "#ef4444" },
  { name: "Gaming", color: "#8b5cf6" },
  { name: "Tech", color: "#06b6d4" },
  { name: "Lifestyle", color: "#ec4899" },
  { name: "Music", color: "#f97316" },
  { name: "Sports", color: "#84cc16" },
  { name: "News", color: "#6366f1" },
  { name: "Science", color: "#14b8a6" },
  { name: "Education", color: "#f59e0b" },
  { name: "Entertainment", color: "#ef4444" },
  { name: "Business", color: "#6366f1" },
  { name: "Food", color: "#f97316" },
  { name: "Travel", color: "#06b6d4" },
  { name: "Health", color: "#10b981" },
  { name: "Art", color: "#ec4899" },
  { name: "DIY", color: "#84cc16" },
  { name: "Reviews", color: "#8b5cf6" },
  { name: "Vlogs", color: "#f59e0b" }
]

export function FolderManagement({ isAdmin = false }: FolderManagementProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [folders, setFolders] = useState<FolderStats[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [filterBy, setFilterBy] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set())
  const [isMovingChannels, setIsMovingChannels] = useState(false)
  
  // Chart-related state
  const [showChartCreator, setShowChartCreator] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string>("")
  const [chartType, setChartType] = useState<"pie" | "bar">("pie")
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [folderTableData, setFolderTableData] = useState<ChannelTableData[]>([])
  const [isLoadingChartData, setIsLoadingChartData] = useState(false)

  useEffect(() => {
    loadChannels()
  }, [])

  useEffect(() => {
    if (channels.length > 0) {
      generateFolderStats()
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

  const generateFolderStats = () => {
    const folderMap = new Map<string, FolderStats>()
    
    // Initialize with predefined niches
    PREDEFINED_NICHES.forEach(niche => {
      folderMap.set(niche.name, {
        name: niche.name,
        count: 0,
        color: niche.color,
        channels: [],
        freshCount: 0,
        agedCount: 0
      })
    })
    
    // Add "Uncategorized" folder
    folderMap.set("Uncategorized", {
      name: "Uncategorized",
      count: 0,
      color: "#6b7280",
      channels: [],
      freshCount: 0,
      agedCount: 0
    })
    
    // Categorize channels
    channels.forEach(channel => {
      const niche = channel.channel_niche || "Uncategorized"
      
      if (!folderMap.has(niche)) {
        // Create new folder for custom niches
        folderMap.set(niche, {
          name: niche,
          count: 0,
          color: "#6b7280",
          channels: [],
          freshCount: 0,
          agedCount: 0
        })
      }
      
      const folder = folderMap.get(niche)!
      folder.channels.push(channel)
      folder.count++
      
      // Count by age
      if (channel.age_classification === "fresh") {
        folder.freshCount++
      } else if (channel.age_classification === "aged") {
        folder.agedCount++
      }
    })
    
    // Convert to array and filter out empty predefined folders
    const folderArray = Array.from(folderMap.values()).filter(folder => 
      folder.count > 0 || folder.name === "Uncategorized"
    )
    
    setFolders(folderArray)
  }

  const moveChannelsToFolder = async (channelIds: string[], targetNiche: string) => {
    setIsMovingChannels(true)
    try {
      const promises = channelIds.map(channelId => 
        fetch(`/api/channels/${channelId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel_niche: targetNiche })
        })
      )
      
      await Promise.all(promises)
      await loadChannels() // Reload to reflect changes
      setSelectedChannels(new Set())
    } catch (error) {
      console.error("Failed to move channels:", error)
    } finally {
      setIsMovingChannels(false)
    }
  }

  const sortFolders = (folders: FolderStats[]) => {
    return [...folders].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "count":
          comparison = a.count - b.count
          break
        case "fresh":
          comparison = a.freshCount - b.freshCount
          break
        case "aged":
          comparison = a.agedCount - b.agedCount
          break
        default:
          comparison = a.name.localeCompare(b.name)
      }
      
      return sortOrder === "asc" ? comparison : -comparison
    })
  }

  const filterFolders = (folders: FolderStats[]) => {
    let filtered = folders
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(folder => {
        // Search in folder name
        const folderNameMatch = folder.name.toLowerCase().includes(searchLower)
        
        // Search in channel names within the folder
        const channelNameMatch = folder.channels.some(channel =>
          channel.channel_name.toLowerCase().includes(searchLower)
        )
        
        // Search in channel countries
        const channelCountryMatch = folder.channels.some(channel =>
          channel.channel_country?.toLowerCase().includes(searchLower)
        )
        
        // Search in age classifications
        const ageMatch = folder.channels.some(channel =>
          channel.age_classification?.toLowerCase().includes(searchLower)
        )
        
        return folderNameMatch || channelNameMatch || channelCountryMatch || ageMatch
      })
    }
    
    if (filterBy !== "all") {
      filtered = filtered.filter(folder => {
        switch (filterBy) {
          case "fresh":
            return folder.freshCount > 0
          case "aged":
            return folder.agedCount > 0
          case "empty":
            return folder.count === 0
          case "populated":
            return folder.count > 0
          default:
            return true
        }
      })
    }
    
    return filtered
  }

  const formatNumber = (num: number | undefined | null) => {
    if (typeof num !== 'number' || isNaN(num) || num === null || num === undefined) {
      return "0"
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  // Removed redundant loadFolderTableData function - logic moved to handleCreateChart

  // Generate chart data based on selected metric
  const generateChartData = (metric: string, data: ChannelTableData[]): ChartData[] => {
    if (!data.length) return []

    // Define colors for different chart segments
    const colors = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316", "#84cc16"]

    switch (metric) {
      case "video_length":
      case "video_style":
      case "thumbnail_style":
      case "channel_type":
      case "language":
      case "status":
        // Categorical data - group by value and count
        const categoryCount = data.reduce((acc, channel) => {
          const value = channel[metric] || "Unknown"
          acc[value] = (acc[value] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        return Object.entries(categoryCount).map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length]
        }))

      case "total_subscribers":
      case "total_views":
      case "total_uploads":
      case "views_last_30_days":
      case "views_per_subscriber":
        // Numerical data - create ranges or individual values for small datasets
        const values = data.map(channel => Number(channel[metric]) || 0).filter(v => v > 0)
        if (values.length === 0) return []

        // For small datasets (<=5 channels), show individual values
        if (values.length <= 5) {
          return data.map((channel, index) => ({
            name: channel.channel_name,
            value: Number(channel[metric]) || 0,
            color: colors[index % colors.length]
          })).filter(item => item.value > 0)
        }

        // For larger datasets, create ranges
        values.sort((a, b) => a - b)
        const min = values[0]
        const max = values[values.length - 1]
        
        // Avoid division by zero for identical values
        if (min === max) {
          return [{
            name: formatNumber(min),
            value: values.length,
            color: colors[0]
          }]
        }
        
        const range = (max - min) / 5 // Create 5 buckets

        const buckets = [
          { name: `${formatNumber(min)} - ${formatNumber(min + range)}`, count: 0 },
          { name: `${formatNumber(min + range)} - ${formatNumber(min + 2 * range)}`, count: 0 },
          { name: `${formatNumber(min + 2 * range)} - ${formatNumber(min + 3 * range)}`, count: 0 },
          { name: `${formatNumber(min + 3 * range)} - ${formatNumber(min + 4 * range)}`, count: 0 },
          { name: `${formatNumber(min + 4 * range)}+`, count: 0 }
        ]

        values.forEach(value => {
          const bucketIndex = Math.min(Math.floor((value - min) / range), 4)
          buckets[bucketIndex].count++
        })

        return buckets.map((bucket, index) => ({
          name: bucket.name,
          value: bucket.count,
          color: colors[index % colors.length]
        })).filter(item => item.value > 0)

      default:
        return []
    }
  }

  // Handle metric selection and chart generation
  const handleCreateChart = async () => {
    if (!selectedMetric || !selectedFolder) return

    setIsLoadingChartData(true)
    try {
      const response = await fetch("/api/channels/table-data")
      if (!response.ok) {
        throw new Error("Failed to fetch table data")
      }
      const allData: ChannelTableData[] = await response.json()
      
      console.log("All data received:", allData.length, "channels")
      console.log("Selected folder:", selectedFolder)
      console.log("Available niches in data:", [...new Set(allData.map(c => c.niche))])
      
      // Filter data for channels in this folder
      let folderData = allData.filter(channel => channel.niche === selectedFolder)
      
      // If no exact match found, try case-insensitive or partial match
      if (folderData.length === 0) {
        folderData = allData.filter(channel => 
          channel.niche?.toLowerCase().includes(selectedFolder.toLowerCase()) ||
          selectedFolder.toLowerCase().includes(channel.niche?.toLowerCase() || '')
        )
      }
      
      // If still no match, show all channels for debugging
      if (folderData.length === 0) {
        console.warn("No channels found for folder:", selectedFolder, "Showing all channels for debugging")
        folderData = allData
      }
      
      console.log("Filtered folder data:", folderData.length, "channels")
      console.log("Folder data sample:", folderData.slice(0, 2))
      
      setFolderTableData(folderData)
      
      // Generate chart data
      const data = generateChartData(selectedMetric, folderData)
      console.log("Generated chart data:", data)
      setChartData(data)
    } catch (error) {
      console.error("Failed to load folder table data:", error)
    } finally {
      setIsLoadingChartData(false)
    }
  }

  // Available metrics for chart creation
  const availableMetrics = [
    { value: "video_length", label: "Video Length" },
    { value: "video_style", label: "Video Style" },
    { value: "thumbnail_style", label: "Thumbnail Style" },
    { value: "channel_type", label: "Channel Type" },
    { value: "language", label: "Language" },
    { value: "status", label: "Status" },
    { value: "total_subscribers", label: "Total Subscribers" },
    { value: "total_views", label: "Total Views" },
    { value: "total_uploads", label: "Total Uploads" },
    { value: "views_last_30_days", label: "Views Last 30 Days" },
    { value: "views_per_subscriber", label: "Views per Subscriber" }
  ]

  const processedFolders = filterFolders(sortFolders(folders))
  const selectedFolderData = folders.find(f => f.name === selectedFolder)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading folders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Channel Folders</h2>
        <p className="text-muted-foreground mt-1">
          Organize and manage your channels by niche and category
        </p>
      </div>

      {/* Intelligent Search Bar */}
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 pb-4 border-b">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search channels by name, niche, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 text-base border-2 focus:border-primary/50 transition-colors"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchTerm("")}
              >
                ×
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-36 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                <SelectItem value="fresh">Has Fresh</SelectItem>
                <SelectItem value="aged">Has Aged</SelectItem>
                <SelectItem value="populated">Populated</SelectItem>
                <SelectItem value="empty">Empty</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="fresh">Fresh</SelectItem>
                <SelectItem value="aged">Aged</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              className="h-11 px-3"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>
        
        {/* Search Results Summary */}
        {searchTerm && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Found {processedFolders.length} folders matching "{searchTerm}"</span>
              {processedFolders.length !== folders.length && (
                <Badge variant="secondary" className="text-xs">
                  {folders.length - processedFolders.length} hidden
                </Badge>
              )}
            </div>
            
            {/* Show matching channels */}
            {processedFolders.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {processedFolders.slice(0, 3).map(folder => {
                  const matchingChannels = folder.channels.filter(channel =>
                    channel.channel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    channel.channel_country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    channel.age_classification?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  
                  return matchingChannels.slice(0, 2).map(channel => (
                    <Badge key={channel.id} variant="outline" className="text-xs bg-primary/5">
                      {channel.channel_name} in {folder.name}
                    </Badge>
                  ))
                }).flat()}
                {processedFolders.reduce((sum, f) => sum + f.channels.filter(c => 
                  c.channel_name.toLowerCase().includes(searchTerm.toLowerCase())
                ).length, 0) > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{processedFolders.reduce((sum, f) => sum + f.channels.filter(c => 
                      c.channel_name.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length, 0) - 6} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="grid" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-current rounded-sm" />
            Grid
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5">
              <div className="w-3 h-0.5 bg-current rounded-full" />
              <div className="w-3 h-0.5 bg-current rounded-full" />
            </div>
            List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processedFolders.map((folder) => (
              <Card 
                key={folder.name} 
                className="cursor-pointer hover:shadow-lg transition-shadow border-l-4"
                style={{ borderLeftColor: folder.color }}
                onClick={() => setSelectedFolder(folder.name)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: folder.color }}
                      />
                      <CardTitle className="text-lg">{folder.name}</CardTitle>
                    </div>
                    <Badge variant="secondary">{folder.count}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fresh (2020+)</span>
                      <span className="font-medium">{folder.freshCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Aged (2006-2019)</span>
                      <span className="font-medium">{folder.agedCount}</span>
                    </div>
                    
                    {folder.channels.length > 0 && (
                      <div className="flex -space-x-2 mt-3">
                        {folder.channels.slice(0, 4).map((channel, index) => (
                          <Avatar key={channel.id} className="w-6 h-6 border-2 border-background">
                            <AvatarImage src={channel.channel_thumbnail_url} />
                            <AvatarFallback className="text-xs">
                              {channel.channel_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {folder.channels.length > 4 && (
                          <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs font-medium">+{folder.channels.length - 4}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="space-y-2">
            {processedFolders.map((folder) => (
              <Card key={folder.name} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: folder.color }}
                    />
                    <div>
                      <h3 className="font-semibold">{folder.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {folder.count} channels • {folder.freshCount} fresh • {folder.agedCount} aged
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFolder(folder.name)}
                  >
                    <FolderOpen className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

      </Tabs>

      {/* Enhanced Folder Detail Dialog */}
      <Dialog open={!!selectedFolder} onOpenChange={() => setSelectedFolder(null)}>
        <DialogContent 
          className="w-[25vw] max-w-none h-[50vh] max-h-none overflow-hidden !w-[25vw] !max-w-none" 
          style={{ 
            width: '25vw !important', 
            maxWidth: 'none !important',
            minWidth: '25vw'
          }}
        >
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-5 h-5 rounded-full shadow-sm"
                    style={{ backgroundColor: selectedFolderData?.color }}
                  />
                  <span className="text-xl font-bold">{selectedFolder}</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {selectedFolderData?.count} channels
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {selectedFolderData?.freshCount} fresh
                  </Badge>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {selectedFolderData?.agedCount} aged
                  </Badge>
                </div>
              </DialogTitle>
            </div>
          </DialogHeader>
          
          {selectedFolderData && (
            <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="charts">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Charts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              {/* Folder Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-blue-900">{selectedFolderData.count}</p>
                      <p className="text-sm text-blue-700">Total Channels</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-900">{selectedFolderData.freshCount}</p>
                      <p className="text-sm text-green-700">Fresh (2020+)</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold text-orange-900">{selectedFolderData.agedCount}</p>
                      <p className="text-sm text-orange-700">Aged (2006-19)</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold text-purple-900">
                        {selectedFolderData.freshCount > 0 ? 
                          ((selectedFolderData.freshCount / selectedFolderData.count) * 100).toFixed(0) : 0}%
                      </p>
                      <p className="text-sm text-purple-700">Fresh Ratio</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Age Distribution Bar */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedFolderData.color }}
                  />
                  Age Distribution
                </h4>
                <div className="space-y-2">
                  <div className="flex h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500 transition-all duration-300"
                      style={{ width: `${selectedFolderData.freshCount > 0 ? (selectedFolderData.freshCount / selectedFolderData.count) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-orange-500 transition-all duration-300"
                      style={{ width: `${selectedFolderData.agedCount > 0 ? (selectedFolderData.agedCount / selectedFolderData.count) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Fresh: {selectedFolderData.count > 0 ? ((selectedFolderData.freshCount / selectedFolderData.count) * 100).toFixed(1) : '0.0'}%
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      Aged: {selectedFolderData.count > 0 ? ((selectedFolderData.agedCount / selectedFolderData.count) * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Channels Grid */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center justify-between">
                  <span>Channels in this folder</span>
                  <Badge variant="outline">{selectedFolderData.channels.length} items</Badge>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {selectedFolderData.channels.map((channel) => (
                    <Card key={channel.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 hover:border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-12 h-12 ring-2 ring-background shadow-sm">
                            <AvatarImage src={channel.channel_thumbnail_url} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                              {channel.channel_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <div>
                              <h5 className="font-semibold truncate group-hover:text-primary transition-colors">
                                {channel.channel_name}
                              </h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={channel.age_classification === "fresh" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {channel.age_classification}
                                </Badge>
                                {channel.creation_year && (
                                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                    {channel.creation_year}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Channel Stats */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {channel.total_subscribers && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Users className="w-3 h-3" />
                                  <span>{formatNumber(channel.total_subscribers)}</span>
                                </div>
                              )}
                              {channel.total_views && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Eye className="w-3 h-3" />
                                  <span>{formatNumber(channel.total_views)}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Quick Actions */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs"
                                onClick={() => window.open(`https://youtube.com/channel/${channel.channel_id}`, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {selectedFolderData.channels.length === 0 && (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                    <Folder className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">This folder is empty</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Add channels to this niche to see them here
                    </p>
                  </div>
                )}
              </div>
              </TabsContent>

              {/* Charts Tab */}
              <TabsContent value="charts" className="space-y-6 overflow-y-auto max-h-[calc(95vh-200px)]">
                <div className="space-y-6">
                  {/* Chart Creation Controls */}
                  <div className="bg-muted/30 p-6 rounded-lg border">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Create Chart from Folder Data
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="metric-select">Select Metric</Label>
                        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a metric..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableMetrics.map((metric) => (
                              <SelectItem key={metric.value} value={metric.value}>
                                {metric.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="chart-type">Chart Type</Label>
                        <Select value={chartType} onValueChange={(value: "pie" | "bar") => setChartType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pie">
                              <div className="flex items-center gap-2">
                                <PieChart className="w-4 h-4" />
                                Pie Chart
                              </div>
                            </SelectItem>
                            <SelectItem value="bar">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Bar Chart
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <Button 
                          onClick={handleCreateChart} 
                          disabled={!selectedMetric || isLoadingChartData}
                          className="w-full"
                        >
                          {isLoadingChartData ? "Loading..." : "Generate Chart"}
                        </Button>
                      </div>
                    </div>

                    {selectedMetric && (
                      <p className="text-sm text-muted-foreground">
                        This will create a {chartType} chart showing the distribution of {availableMetrics.find(m => m.value === selectedMetric)?.label.toLowerCase()} across all channels in the "{selectedFolder}" folder.
                      </p>
                    )}
                  </div>

                  {/* Chart Display */}
                  {chartData.length > 0 && (
                    <div className="bg-background p-6 rounded-lg border">
                      <h4 className="font-semibold mb-4 text-center">
                        {availableMetrics.find(m => m.value === selectedMetric)?.label} Distribution - {selectedFolder}
                      </h4>
                      
                      <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === "pie" ? (
                            <RechartsPieChart>
                              <Pie 
                                data={chartData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={60} 
                                outerRadius={120} 
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="name"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value, name) => [value, name]} />
                              <Legend />
                            </RechartsPieChart>
                          ) : (
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="value" fill="#8884d8">
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>

                      {/* Chart Data Summary */}
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {chartData.slice(0, 4).map((item, index) => (
                          <div key={index} className="text-center p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-semibold">{item.value}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {chartData.length === 0 && selectedMetric && !isLoadingChartData && (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                      <BarChart3 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground font-medium">No chart data available</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        {folderTableData.length === 0 
                          ? `No channels found in folder "${selectedFolder}". Check the browser console for debugging info.`
                          : `No data available for metric "${availableMetrics.find(m => m.value === selectedMetric)?.label}". Try a different metric.`
                        }
                      </p>
                      {folderTableData.length > 0 && (
                        <p className="text-xs text-muted-foreground/60 mt-2">
                          Found {folderTableData.length} channels in this folder
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
