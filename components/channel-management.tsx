"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react"
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
const mockChannels = [
  { id: 1, subscribers: 2100000 },
  { id: 2, subscribers: 1800000 },
  { id: 3, subscribers: 6200000 },
  { id: 4, subscribers: 2800000 },
  { id: 5, subscribers: 2000000 },
  { id: 6, subscribers: 1200000 },
  { id: 7, subscribers: 450000 },
  { id: 8, subscribers: 380000 },
  { id: 9, subscribers: 3200000 },
  { id: 10, subscribers: 1500000 },
]

export function ChannelManagement({ isAdmin = false }: ChannelManagementProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNiche, setSelectedNiche] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [formData, setFormData] = useState({
    channel_id: "",
    channel_name: "",
    display_name: "",
    handle: "",
    niche: "",
    country_code: "",
    country: "",
    website_url: "",
    channel_creation_date: "",
  })

  useEffect(() => {
    loadChannels()
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

  const filterChannels = () => {
    let filtered = channels

    if (searchTerm) {
      filtered = filtered.filter(
        (channel) =>
          channel.channel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          channel.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (channel.handle && channel.handle.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (selectedNiche !== "all") {
      filtered = filtered.filter((channel) => channel.niche === selectedNiche)
    }

    setFilteredChannels(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      }

      await loadChannels()
      resetForm()
      setIsAddDialogOpen(false)
      setEditingChannel(null)
    } catch (error) {
      console.error("Failed to save channel:", error)
    }
  }

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel)
    setFormData({
      channel_id: channel.channel_id,
      channel_name: channel.channel_name,
      display_name: channel.display_name,
      handle: channel.handle || "",
      niche: channel.niche || "",
      country_code: channel.country_code || "",
      country: channel.country || "",
      website_url: channel.website_url || "",
      channel_creation_date: channel.channel_creation_date ? channel.channel_creation_date.split("T")[0] : "",
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
      } catch (error) {
        console.error("Failed to delete channel:", error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      channel_id: "",
      channel_name: "",
      display_name: "",
      handle: "",
      niche: "",
      country_code: "",
      country: "",
      website_url: "",
      channel_creation_date: "",
    })
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="channel_id">Channel ID</Label>
                    <Input
                      id="channel_id"
                      value={formData.channel_id}
                      onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                      placeholder="UC..."
                      required
                      disabled={!!editingChannel}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="handle">Handle</Label>
                    <Input
                      id="handle"
                      value={formData.handle}
                      onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                      placeholder="@username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel_name">Channel Name</Label>
                  <Input
                    id="channel_name"
                    value={formData.channel_name}
                    onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    required
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
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="United States"
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

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false)
                      setEditingChannel(null)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90">
                    {editingChannel ? "Update" : "Add"} Channel
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChannels.map((channel) => (
          <Card key={channel.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={channel.avatar_url || "/placeholder.svg"} alt={channel.display_name} />
                    <AvatarFallback>{channel.display_name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">{channel.display_name}</CardTitle>
                    <p className="text-sm text-muted-foreground truncate">{channel.handle || channel.channel_name}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(channel)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(channel.channel_id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                {channel.niche && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {channel.niche}
                  </Badge>
                )}
                {channel.country && <span className="text-sm text-muted-foreground">{channel.country}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Subscribers</p>
                  <p className="font-semibold">
                    {formatNumber(mockChannels.find((c) => c.id === channel.id)?.subscribers || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Views</p>
                  <p className="font-semibold">
                    {formatNumber((mockChannels.find((c) => c.id === channel.id)?.subscribers || 0) * 150)}
                  </p>
                </div>
              </div>

              {channel.website_url && (
                <div className="pt-2 border-t">
                  <a
                    href={channel.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate block"
                  >
                    {channel.website_url}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredChannels.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No channels found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
