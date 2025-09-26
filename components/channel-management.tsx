"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Search, Filter, RefreshCw, Loader2, StickyNote, ExternalLink, MoreHorizontal } from "lucide-react"
import { NotesModal } from "./notes-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { Channel } from "@/lib/types"
// import { ChannelService } from "@/lib/channel-service"

interface ChannelManagementProps {
  isAdmin?: boolean
}

const NICHES = [
  "Technology",
  "Education",
  "Finance",
  "Business",
  "Lifestyle",
  "Gaming",
  "Entertainment",
  "Health",
  "Travel",
  "Food",
]
// Removed mock data - now using real channel statistics

export function ChannelManagement({ isAdmin = false }: ChannelManagementProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([])
  const [channelStats, setChannelStats] = useState<Record<string, any>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNiche, setSelectedNiche] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resyncingChannels, setResyncingChannels] = useState<Set<string>>(new Set())
  const [openActionsDropdown, setOpenActionsDropdown] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [inputType, setInputType] = useState<'channel_id' | 'handle'>('channel_id')
  const [notesModal, setNotesModal] = useState<{ isOpen: boolean; channelId: string; channelName: string }>({
    isOpen: false,
    channelId: "",
    channelName: "",
  })
  const [channelInput, setChannelInput] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [historyOption, setHistoryOption] = useState<'default' | 'extended' | 'archive'>('default')
  const [formData, setFormData] = useState({
    channel_id: "",
    channel_name: "",
    display_name: "",
    handle: "",
    niche: "",
    language: "",
    website_url: "",
    channel_creation_date: "",
    notes: "",
  })

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        // Load channels first, then stats separately to show channels faster
        await loadChannels()
        setIsLoading(false)
        
        // Load stats in background
        setStatsLoading(true)
        await loadChannelStatistics()
      } finally {
        setStatsLoading(false)
      }
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    filterChannels()
  }, [channels, searchTerm, selectedNiche])

  const loadChannels = async () => {
    try {
      const response = await fetch("/api/channels")
      if (!response.ok) {
        throw new Error("Failed to fetch channels")
      }
      const channelData = await response.json()
      setChannels(channelData)
    } catch (error) {
      console.error("Failed to load channels:", error)
    }
  }

  const loadChannelStatistics = async () => {
    try {
      console.log("=== Loading Channel Statistics ===")
      const response = await fetch("/api/channels/table-data")
      if (!response.ok) {
        throw new Error("Failed to fetch channel statistics")
      }
      const data = await response.json()
      console.log("Table data response:", data)
      console.log("Number of channels:", data.length)
      
      // Convert array to object keyed by channel ID for easy lookup
      const statsMap: Record<string, any> = {}
      data.forEach((channel: any) => {
        console.log(`Mapping channel: ${channel.channel_name} (${channel.id})`)
        console.log(`  - Subscribers: ${channel.total_subscribers}`)
        console.log(`  - Views: ${channel.total_views}`)
        statsMap[channel.id] = channel
      })
      console.log("Final stats map:", statsMap)
      setChannelStats(statsMap)
      console.log("=== End Loading Statistics ===")
    } catch (error) {
      console.error("Failed to load channel statistics:", error)
    }
  }

  const filterChannels = () => {
    let filtered = channels

    if (searchTerm) {
      filtered = filtered.filter(
        (channel) =>
          channel.channel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (channel.channel_handle && channel.channel_handle.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (selectedNiche !== "all") {
      filtered = filtered.filter((channel) => channel.channel_niche === selectedNiche)
    }

    setFilteredChannels(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingChannel) {
        const response = await fetch("/api/channels", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId: editingChannel.channel_id,
            ...formData,
            updated_at: new Date().toISOString(),
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update channel")
        }
      } else {
        // First add the channel
        const response = await fetch("/api/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            avatar_url: `/placeholder.svg?height=80&width=80`,
            banner_url: `/placeholder.svg?height=200&width=800`,
            is_active: true,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to add channel")
        }

        // Automatically fetch SocialBlade data for the new channel
        console.log("Automatically fetching SocialBlade data for new channel with history:", historyOption)
        await fetchSocialBladeData(formData.channel_id, formData.handle, historyOption)
      }

      await loadChannels()
      await loadChannelStatistics()
      resetForm()
      setIsAddDialogOpen(false)
      setEditingChannel(null)
    } catch (error) {
      console.error("Failed to save channel:", error)
      alert("Failed to save channel. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const searchChannelData = async (input: string, type: 'channel_id' | 'handle') => {
    setIsSearching(true)
    try {
      console.log("=== Searching Channel Data ===")
      console.log("Input:", input)
      console.log("Type:", type)

      // Prepare query based on input type
      let query = input
      if (type === 'handle') {
        // SocialBlade expects @handle format, so add @ if not present
        query = input.startsWith("@") ? input : `@${input}`
      }

      const response = await fetch("/api/channels/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, history: historyOption }),
      })

      const channelData = await response.json()

      if (!response.ok) {
        throw new Error(channelData.error || "Failed to search channel")
      }

      console.log("=== Channel Search Success ===")
      console.log("Found channel:", channelData)
      console.log("=== End Channel Search ===")

      // Auto-populate form with SocialBlade data
      setFormData({
        channel_id: channelData.channel_id,
        channel_name: channelData.channel_name || "",
        display_name: channelData.channel_name || "",
        handle: channelData.handle || "",
        niche: "",
        language: "",
        website_url: channelData.website_url || "",
        channel_creation_date: channelData.created_date ? channelData.created_date.split("T")[0] : "",
        notes: "",
      })

      return channelData
    } catch (error) {
      console.error("Failed to search channel:", error)
      alert(`Failed to find channel: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSearching(false)
    }
  }

  const fetchSocialBladeData = async (channelId: string, handle?: string, history: 'default' | 'extended' | 'archive' = 'default') => {
    try {
      // Use handle if available, otherwise use channel_id
      const query = handle || channelId

      const response = await fetch("/api/socialblade/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          history: history,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("SocialBlade fetch error:", data)
        throw new Error(data.error || "Failed to fetch SocialBlade data")
      }

      console.log("=== SocialBlade Auto-Fetch Success ===")
      console.log("Channel:", channelId)
      console.log("Response:", data)
      console.log("=== End Auto-Fetch Success ===")

      return data
    } catch (error) {
      console.error("Failed to fetch SocialBlade data:", error)
      // Don't throw error here - channel creation should still succeed even if SocialBlade fails
      alert(`Channel added successfully, but failed to fetch SocialBlade data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel)
    setFormData({
      channel_id: channel.channel_id,
      channel_name: channel.channel_name,
      display_name: channel.channel_name,
      handle: channel.channel_handle || "",
      niche: channel.channel_niche || "",
      language: channel.channel_language || "",
      website_url: channel.website || "",
      channel_creation_date: channel.channel_created_date ? channel.channel_created_date.split("T")[0] : "",
      notes: channel.notes || "",
    })
  }

  const handleOpenNotes = (channel: Channel) => {
    setNotesModal({
      isOpen: true,
      channelId: channel.channel_id,
      channelName: channel.channel_name,
    })
  }

  const handleCloseNotes = () => {
    setNotesModal({
      isOpen: false,
      channelId: "",
      channelName: "",
    })
  }

  const handleDelete = async (channelId: string) => {
    if (confirm("Are you sure you want to delete this channel?")) {
      try {
        const response = await fetch(`/api/channels?channelId=${channelId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete channel")
        }

        await loadChannels()
        await loadChannelStatistics()
      } catch (error) {
        console.error("Failed to delete channel:", error)
      }
    }
  }

  const handleResyncChannel = async (channelId: string, history: 'default' | 'extended' | 'archive' = 'default') => {
    // Add channel to resyncing set
    setResyncingChannels(prev => new Set(prev).add(channelId))
    
    try {
      // Find the channel to get its identifier for SocialBlade
      const channel = channels.find(c => c.channel_id === channelId)
      if (!channel) {
        console.error("Channel not found")
        return
      }

      console.log("Resyncing channel data for:", channel.channel_name, "with history:", history)
      
      // Use the shared fetchSocialBladeData function with history parameter
      await fetchSocialBladeData(channelId, channel.channel_handle, history)

      // Reload channel statistics after successful fetch
      await loadChannelStatistics()
      console.log("Channel resynced successfully:", channel.channel_name)
      
      const historyLabels = {
        default: "Default (30 days)",
        extended: "Extended (1 year)",
        archive: "Archive (3 years)"
      }
      
      alert(`Channel "${channel.channel_name}" resynced successfully with ${historyLabels[history]} data!`)
    } catch (error) {
      console.error("Failed to resync channel:", error)
      alert("Failed to resync channel data from SocialBlade. Please try again.")
    } finally {
      // Remove channel from resyncing set
      setResyncingChannels(prev => {
        const newSet = new Set(prev)
        newSet.delete(channelId)
        return newSet
      })
    }
  }

  const resetForm = () => {
    setFormData({
      channel_id: "",
      channel_name: "",
      display_name: "",
      handle: "",
      niche: "",
      language: "",
      website_url: "",
      channel_creation_date: "",
      notes: "",
    })
    setChannelInput("")
    setInputType('channel_id')
    setHistoryOption('default')
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Channel Management</h2>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage your tracked YouTube channels" : "View tracked YouTube channels"}
          </p>
        </div>

        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingChannel ? "Edit Channel" : "Add New Channel"}</DialogTitle>
                <DialogDescription>
                  {editingChannel ? "Update channel information" : "Add a new YouTube channel to track"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingChannel && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    {/* Channel Input Type Selection */}
                    <div>
                      <Label className="text-base font-medium">How would you like to add the channel?</Label>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="input-type-id"
                            name="input-type"
                            value="channel_id"
                            checked={inputType === 'channel_id'}
                            onChange={(e) => setInputType(e.target.value as 'channel_id' | 'handle')}
                            className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <Label htmlFor="input-type-id" className="cursor-pointer">Channel ID</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="input-type-handle"
                            name="input-type"
                            value="handle"
                            checked={inputType === 'handle'}
                            onChange={(e) => setInputType(e.target.value as 'channel_id' | 'handle')}
                            className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <Label htmlFor="input-type-handle" className="cursor-pointer">Handle (@username)</Label>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Input Field */}
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {inputType === 'channel_id' ? (
                          <div className="flex-1">
                            <Label htmlFor="channel_input">Channel ID</Label>
                            <Input
                              id="channel_input"
                              value={channelInput}
                              onChange={(e) => setChannelInput(e.target.value)}
                              placeholder="UCxxxxxxxxxxxxxxxxxxxxx"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter the YouTube channel ID (starts with UC)
                            </p>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <Label htmlFor="channel_input">Channel Handle</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">@</span>
                              <Input
                                id="channel_input"
                                value={channelInput}
                                onChange={(e) => setChannelInput(e.target.value)}
                                placeholder="channelhandle"
                                className="pl-7"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Enter the YouTube handle without the @ symbol
                            </p>
                          </div>
                        )}
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => searchChannelData(channelInput, inputType)}
                          disabled={!channelInput.trim() || isSearching}
                          className="mt-6"
                        >
                          {isSearching ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Searching...
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4 mr-2" />
                              Search
                            </>
                          )}
                        </Button>
                      </div>

                      {/* History Option Selector */}
                      <div>
                        <Label htmlFor="history-option" className="text-sm font-medium">Data History</Label>
                        <Select value={historyOption} onValueChange={(value: 'default' | 'extended' | 'archive') => setHistoryOption(value)}>
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">
                              Default (30 days) - 1 credit
                            </SelectItem>
                            <SelectItem value="extended">
                              Extended (1 year) - 2 credits
                            </SelectItem>
                            <SelectItem value="archive">
                              Archive (3 years) - 3 credits
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Choose how much historical data to fetch from SocialBlade
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-populated fields from SocialBlade (or editable for existing channels) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="channel_id">Channel ID</Label>
                    <Input
                      id="channel_id"
                      value={formData.channel_id}
                      onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                      placeholder="Will be auto-filled from search"
                      required
                      readOnly={!editingChannel}
                      className={!editingChannel ? "bg-muted" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="handle">Handle</Label>
                    <Input
                      id="handle"
                      value={formData.handle}
                      onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                      placeholder="Will be auto-filled from search"
                      readOnly={!editingChannel}
                      className={!editingChannel ? "bg-muted" : ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel_name">Channel Name</Label>
                  <Input
                    id="channel_name"
                    value={formData.channel_name}
                    onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                    placeholder={editingChannel ? "" : "Will be auto-filled from search"}
                    required
                    readOnly={!editingChannel && !formData.channel_name}
                    className={!editingChannel && !formData.channel_name ? "bg-muted" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder={editingChannel ? "" : "Will be auto-filled from search"}
                    required
                    readOnly={!editingChannel && !formData.display_name}
                    className={!editingChannel && !formData.display_name ? "bg-muted" : ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="niche">Niche</Label>
                    <Select
                      value={formData.niche}
                      onValueChange={(value) => setFormData({ ...formData, niche: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select niche" />
                      </SelectTrigger>
                      <SelectContent>
                        {NICHES.map((niche) => (
                          <SelectItem key={niche} value={niche}>
                            {niche}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Input
                      id="language"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      placeholder="English"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel_creation_date">Channel Creation Date</Label>
                  <Input
                    id="channel_creation_date"
                    type="date"
                    value={formData.channel_creation_date}
                    onChange={(e) => setFormData({ ...formData, channel_creation_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any notes about this channel..."
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false)
                      setEditingChannel(null)
                      resetForm()
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {editingChannel ? "Updating..." : "Adding & Syncing..."}
                      </>
                    ) : (
                      <>
                        {editingChannel ? "Update" : "Add"} Channel
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-6 mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedNiche} onValueChange={setSelectedNiche}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by niche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Niches</SelectItem>
              {NICHES.map((niche) => (
                <SelectItem key={niche} value={niche}>
                  {niche}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Channels Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="min-w-0 flex-1">
                      <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 bg-muted rounded w-20 mb-1"></div>
                    <div className="h-5 bg-muted rounded w-16"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-muted rounded w-12 mb-1"></div>
                    <div className="h-5 bg-muted rounded w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChannels.map((channel) => (
          <Card key={channel.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={channel.channel_thumbnail_url || "/placeholder.svg"} alt={channel.channel_name} />
                    <AvatarFallback>{channel.channel_name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate flex items-center gap-2">
                      {channel.channel_name}
                      <a 
                        href={`https://youtube.com/channel/${channel.channel_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="Open YouTube channel"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate">{channel.channel_handle || channel.channel_name}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpenActionsDropdown(openActionsDropdown === channel.channel_id ? null : channel.channel_id)}
                      title="Channel actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>

                    {openActionsDropdown === channel.channel_id && (
                      <>
                        {/* Backdrop to close dropdown */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setOpenActionsDropdown(null)}
                        />
                        
                        {/* Actions dropdown content */}
                        <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] bg-background border border-border rounded-md shadow-lg py-1">
                          {/* Resync options */}
                          <div className="px-3 py-1 text-xs font-medium text-muted-foreground border-b border-border">
                            Resync Options
                          </div>
                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                            onClick={() => {
                              handleResyncChannel(channel.channel_id, 'default')
                              setOpenActionsDropdown(null)
                            }}
                            disabled={resyncingChannels.has(channel.channel_id)}
                          >
                            {resyncingChannels.has(channel.channel_id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            Default (30 days) - 1 credit
                          </button>
                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                            onClick={() => {
                              handleResyncChannel(channel.channel_id, 'extended')
                              setOpenActionsDropdown(null)
                            }}
                            disabled={resyncingChannels.has(channel.channel_id)}
                          >
                            {resyncingChannels.has(channel.channel_id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            Extended (1 year) - 2 credits
                          </button>
                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                            onClick={() => {
                              handleResyncChannel(channel.channel_id, 'archive')
                              setOpenActionsDropdown(null)
                            }}
                            disabled={resyncingChannels.has(channel.channel_id)}
                          >
                            {resyncingChannels.has(channel.channel_id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            Archive (3 years) - 3 credits
                          </button>
                          
                          {/* Separator */}
                          <div className="border-t border-border my-1" />
                          
                          {/* Other actions */}
                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                            onClick={() => {
                              handleOpenNotes(channel)
                              setOpenActionsDropdown(null)
                            }}
                          >
                            <StickyNote className="w-4 h-4" />
                            View Notes
                          </button>
                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors text-destructive hover:text-destructive"
                            onClick={() => {
                              handleDelete(channel.channel_id)
                              setOpenActionsDropdown(null)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Channel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                {channel.channel_niche && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {channel.channel_niche}
                  </Badge>
                )}
                {channel.channel_country && <span className="text-sm text-muted-foreground">{channel.channel_country}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Subscribers</p>
                  {statsLoading ? (
                    <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                  ) : (
                    <p className="font-semibold">
                      {formatNumber(channelStats[channel.id || '']?.total_subscribers || 0)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Views</p>
                  {statsLoading ? (
                    <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {formatNumber(channelStats[channel.id || '']?.total_views || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(channelStats[channel.id || '']?.views_last_30_days || 0)} (30d)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Website URL not available in Channel type - could be added to custom_fields if needed */}
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredChannels.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No channels found matching your criteria.</p>
        </div>
      )}
      </div>

      {/* Notes Modal */}
      <NotesModal
        isOpen={notesModal.isOpen}
        onClose={handleCloseNotes}
        channelId={notesModal.channelId}
        channelName={notesModal.channelName}
      />
    </div>
  )
}
