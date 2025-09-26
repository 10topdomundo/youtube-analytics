"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, Download, Trash2, Plus, Eye, Calendar, Users, Play, TrendingUp, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

interface ChannelTableData {
  id: string
  channel_id: string
  channel_name: string
  channel_niche?: string
  channel_thumbnail_url?: string
  total_subscribers?: number
  total_views?: number
  total_uploads?: number
  views_last_30d?: number
  views_delta_30d?: number
  views_delta_7d?: number
  views_delta_3d?: number
  views_per_subscriber?: number
  // Removed assumption-based fields that were incorrectly calculated
  channel_created_date?: string
  creation_year?: number
  age_classification?: string
  channel_country?: string
  channel_language?: string
  status?: string
}

interface SortConfig {
  key: keyof ChannelTableData
  direction: "asc" | "desc"
}

interface FilterConfig {
  niche?: string
  ageClassification?: string
  country?: string
  language?: string
  dateRange?: DateRange
  subscriberRange?: { min?: number; max?: number }
  viewRange?: { min?: number; max?: number }
  status?: string
}

interface AdvancedChannelTableProps {
  isAdmin?: boolean
  onChannelSelect?: (channelId: string) => void
  onChannelDelete?: (channelIds: string[]) => void
}

export function AdvancedChannelTable({ 
  isAdmin = false, 
  onChannelSelect,
  onChannelDelete 
}: AdvancedChannelTableProps) {
  const [channels, setChannels] = useState<ChannelTableData[]>([])
  const [filteredChannels, setFilteredChannels] = useState<ChannelTableData[]>([])
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "channel_name", direction: "asc" })
  const [filters, setFilters] = useState<FilterConfig>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Available filter options
  const [niches, setNiches] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])

  useEffect(() => {
    loadChannels()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [channels, filters, searchTerm, sortConfig])

  const loadChannels = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/channels/table-data")
      if (!response.ok) throw new Error("Failed to fetch channels")
      
      const data = await response.json()
      
      // Process channels to add age classification and other computed fields
      const processedChannels = data.map((channel: any) => {
        const creationYear = channel.channel_created_date 
          ? new Date(channel.channel_created_date).getFullYear()
          : null
        
        let ageClassification = "unknown"
        if (creationYear) {
          if (creationYear >= 2020) {
            ageClassification = "fresh"
          } else if (creationYear >= 2006) {
            ageClassification = "aged"
          } else {
            ageClassification = "vintage"
          }
        }
        
        return {
          ...channel,
          creation_year: creationYear,
          age_classification: ageClassification
        }
      })
      
      setChannels(processedChannels)
      
      // Extract unique values for filters
      const uniqueNiches = [...new Set(processedChannels.map((c: any) => c.channel_niche).filter(Boolean))]
      const uniqueCountries = [...new Set(processedChannels.map((c: any) => c.channel_country).filter(Boolean))]
      const uniqueLanguages = [...new Set(processedChannels.map((c: any) => c.channel_language).filter(Boolean))]
      
      setNiches(uniqueNiches.sort())
      setCountries(uniqueCountries.sort())
      setLanguages(uniqueLanguages.sort())
      
    } catch (error) {
      console.error("Failed to load channels:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...channels]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(channel =>
        channel.channel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        channel.channel_niche?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        channel.channel_country?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply filters
    if (filters.niche) {
      filtered = filtered.filter(channel => channel.channel_niche === filters.niche)
    }

    if (filters.ageClassification) {
      filtered = filtered.filter(channel => channel.age_classification === filters.ageClassification)
    }

    if (filters.country) {
      filtered = filtered.filter(channel => channel.channel_country === filters.country)
    }

    if (filters.language) {
      filtered = filtered.filter(channel => channel.channel_language === filters.language)
    }

    if (filters.status) {
      filtered = filtered.filter(channel => channel.status === filters.status)
    }

    // Apply date range filter
    if (filters.dateRange?.from || filters.dateRange?.to) {
      filtered = filtered.filter(channel => {
        if (!channel.channel_created_date) return false
        const channelDate = new Date(channel.channel_created_date)
        
        if (filters.dateRange?.from && channelDate < filters.dateRange.from) return false
        if (filters.dateRange?.to && channelDate > filters.dateRange.to) return false
        
        return true
      })
    }

    // Apply subscriber range filter
    if (filters.subscriberRange?.min !== undefined || filters.subscriberRange?.max !== undefined) {
      filtered = filtered.filter(channel => {
        const subs = channel.total_subscribers || 0
        if (filters.subscriberRange?.min !== undefined && subs < filters.subscriberRange.min) return false
        if (filters.subscriberRange?.max !== undefined && subs > filters.subscriberRange.max) return false
        return true
      })
    }

    // Apply view range filter
    if (filters.viewRange?.min !== undefined || filters.viewRange?.max !== undefined) {
      filtered = filtered.filter(channel => {
        const views = channel.total_views || 0
        if (filters.viewRange?.min !== undefined && views < filters.viewRange.min) return false
        if (filters.viewRange?.max !== undefined && views > filters.viewRange.max) return false
        return true
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }
      
      return sortConfig.direction === "asc" ? comparison : -comparison
    })

    setFilteredChannels(filtered)
  }

  const handleSort = (key: keyof ChannelTableData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedChannels(new Set(filteredChannels.map(c => c.id)))
    } else {
      setSelectedChannels(new Set())
    }
  }

  const handleSelectChannel = (channelId: string, checked: boolean) => {
    const newSelected = new Set(selectedChannels)
    if (checked) {
      newSelected.add(channelId)
    } else {
      newSelected.delete(channelId)
    }
    setSelectedChannels(newSelected)
  }

  const formatNumber = (num: number | undefined | null) => {
    if (!num) return "0"
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const exportToCSV = () => {
    const headers = [
      "Channel Name", "Niche", "Subscribers", "Views", "Uploads", 
      "Country", "Language", "Created", "Age", "Status"
    ]
    
    const csvData = filteredChannels.map(channel => [
      channel.channel_name,
      channel.channel_niche || "",
      channel.total_subscribers || 0,
      channel.total_views || 0,
      channel.total_uploads || 0,
      channel.channel_country || "",
      channel.channel_language || "",
      channel.channel_created_date || "",
      channel.age_classification || "",
      channel.status || ""
    ])
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `channels_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const SortButton = ({ column, children }: { column: keyof ChannelTableData, children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 lg:px-3"
      onClick={() => handleSort(column)}
    >
      {children}
      {sortConfig.key === column ? (
        sortConfig.direction === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading channels...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Channel Analytics Table</h2>
          <p className="text-muted-foreground">
            {filteredChannels.length} of {channels.length} channels
            {selectedChannels.size > 0 && ` • ${selectedChannels.size} selected`}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {isAdmin && selectedChannels.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => onChannelDelete?.(Array.from(selectedChannels))}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete ({selectedChannels.size})
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search channels, niches, or countries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Niche</Label>
                <Select value={filters.niche || "__all__"} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, niche: value === "__all__" ? undefined : value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="All niches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All niches</SelectItem>
                    {niches.map(niche => (
                      <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Age Classification</Label>
                <Select value={filters.ageClassification || "__all__"} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, ageClassification: value === "__all__" ? undefined : value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="All ages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All ages</SelectItem>
                    <SelectItem value="fresh">Fresh (2020+)</SelectItem>
                    <SelectItem value="aged">Aged (2006-2019)</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Country</Label>
                <Select value={filters.country || "__all__"} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, country: value === "__all__" ? undefined : value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All countries</SelectItem>
                    {countries.map(country => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Language</Label>
                <Select value={filters.language || "__all__"} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, language: value === "__all__" ? undefined : value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="All languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All languages</SelectItem>
                    {languages.map(language => (
                      <SelectItem key={language} value={language}>{language}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({})
                  setSearchTerm("")
                }}
              >
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedChannels.size === filteredChannels.length && filteredChannels.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16"></TableHead>
                <TableHead>
                  <SortButton column="channel_name">Channel</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton column="channel_niche">Niche</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton column="total_subscribers">Subscribers</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton column="total_views">Views</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton column="total_uploads">Uploads</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton column="views_per_subscriber">Views/Sub</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton column="age_classification">Age</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton column="channel_country">Country</SortButton>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChannels.map((channel) => (
                <TableRow key={channel.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedChannels.has(channel.id)}
                      onCheckedChange={(checked) => handleSelectChannel(channel.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={channel.channel_thumbnail_url} />
                      <AvatarFallback>{channel.channel_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {channel.channel_name}
                        <a 
                          href={`https://youtube.com/channel/${channel.channel_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Open YouTube channel"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {channel.creation_year && `Created ${channel.creation_year}`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {channel.channel_niche && (
                      <Badge variant="secondary">{channel.channel_niche}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      {formatNumber(channel.total_subscribers)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      {formatNumber(channel.total_views)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Play className="w-3 h-3 text-muted-foreground" />
                      {formatNumber(channel.total_uploads)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {channel.views_per_subscriber ? 
                      channel.views_per_subscriber.toFixed(1) : "N/A"
                    }
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        channel.age_classification === "fresh" ? "default" :
                        channel.age_classification === "aged" ? "secondary" : "outline"
                      }
                    >
                      {channel.age_classification}
                    </Badge>
                  </TableCell>
                  <TableCell>{channel.channel_country || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onChannelSelect?.(channel.channel_id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onChannelDelete?.([channel.id])}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {filteredChannels.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No channels found matching your criteria.</p>
          <Button variant="outline" className="mt-4" onClick={() => {
            setFilters({})
            setSearchTerm("")
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
