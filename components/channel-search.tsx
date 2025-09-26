"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Eye, AlertTriangle, Loader2, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ChannelPreview {
  channel_id: string
  channel_name: string
  handle?: string
  avatar_url?: string
  banner_url?: string
  subscriber_count?: number
  view_count?: number
  video_count?: number
  created_date?: string
  country?: string
  is_terminated?: boolean
  termination_reason?: string
  description?: string
}

interface ChannelSearchProps {
  onChannelAdd?: (channelData: ChannelPreview) => void
  existingChannels?: string[] // Array of existing channel IDs to prevent duplicates
}

export function ChannelSearch({ onChannelAdd, existingChannels = [] }: ChannelSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ChannelPreview[]>([])
  const [selectedChannel, setSelectedChannel] = useState<ChannelPreview | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchChannels = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError(null)
    
    try {
      // Extract channel ID from various YouTube URL formats
      const channelId = extractChannelId(searchQuery)
      
      if (!channelId) {
        throw new Error("Please enter a valid YouTube channel URL or ID")
      }

      const response = await fetch("/api/channels/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: channelId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to search channel")
      }

      const data = await response.json()
      setSearchResults([data])
      
    } catch (error) {
      console.error("Search error:", error)
      setError(error instanceof Error ? error.message : "Search failed")
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const extractChannelId = (input: string): string | null => {
    const trimmed = input.trim()
    
    // Direct channel ID (starts with UC)
    if (trimmed.startsWith("UC") && trimmed.length === 24) {
      return trimmed
    }
    
    // YouTube channel URL patterns
    const patterns = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/@([a-zA-Z0-9_.-]+)/,
      /youtu\.be\/([a-zA-Z0-9_-]+)/,
    ]
    
    for (const pattern of patterns) {
      const match = trimmed.match(pattern)
      if (match) {
        return match[1]
      }
    }
    
    return null
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const handlePreview = (channel: ChannelPreview) => {
    setSelectedChannel(channel)
    setIsPreviewOpen(true)
  }

  const handleAddChannel = async (channel: ChannelPreview) => {
    if (existingChannels.includes(channel.channel_id)) {
      setError("This channel is already in your database")
      return
    }

    setIsAdding(true)
    try {
      if (onChannelAdd) {
        await onChannelAdd(channel)
      }
      setIsPreviewOpen(false)
      setSearchResults([])
      setSearchQuery("")
    } catch (error) {
      console.error("Add channel error:", error)
      setError(error instanceof Error ? error.message : "Failed to add channel")
    } finally {
      setIsAdding(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchChannels()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search & Add Channels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter YouTube channel URL or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={searchChannels} 
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Search Results</h3>
              {searchResults.map((channel) => (
                <Card key={channel.channel_id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={channel.avatar_url} alt={channel.channel_name} />
                        <AvatarFallback>
                          {channel.channel_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">{channel.channel_name}</h4>
                          {channel.is_terminated && (
                            <Badge variant="destructive" className="text-xs">
                              Terminated
                            </Badge>
                          )}
                          {existingChannels.includes(channel.channel_id) && (
                            <Badge variant="secondary" className="text-xs">
                              Already Added
                            </Badge>
                          )}
                        </div>
                        
                        {channel.handle && (
                          <p className="text-sm text-muted-foreground">@{channel.handle}</p>
                        )}
                        
                        <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                          {channel.subscriber_count !== undefined && (
                            <span>{formatNumber(channel.subscriber_count)} subscribers</span>
                          )}
                          {channel.view_count !== undefined && (
                            <span>{formatNumber(channel.view_count)} views</span>
                          )}
                          {channel.video_count !== undefined && (
                            <span>{channel.video_count} videos</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(channel)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => handleAddChannel(channel)}
                          disabled={existingChannels.includes(channel.channel_id) || isAdding}
                        >
                          {isAdding ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-1" />
                          )}
                          Add
                        </Button>
                      </div>
                    </div>

                    {channel.is_terminated && channel.termination_reason && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertTriangle className="w-4 h-4" />
                        <AlertDescription>
                          <strong>Channel Terminated:</strong> {channel.termination_reason}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channel Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Channel Preview</DialogTitle>
          </DialogHeader>
          
          {selectedChannel && (
            <div className="space-y-6">
              {/* Header with avatar and basic info */}
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedChannel.avatar_url} alt={selectedChannel.channel_name} />
                  <AvatarFallback className="text-lg">
                    {selectedChannel.channel_name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold">{selectedChannel.channel_name}</h2>
                    {selectedChannel.is_terminated && (
                      <Badge variant="destructive">Terminated</Badge>
                    )}
                  </div>
                  
                  {selectedChannel.handle && (
                    <p className="text-muted-foreground mb-2">@{selectedChannel.handle}</p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={`https://youtube.com/channel/${selectedChannel.channel_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View on YouTube
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Banner */}
              {selectedChannel.banner_url && (
                <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={selectedChannel.banner_url} 
                    alt="Channel banner"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {selectedChannel.subscriber_count ? formatNumber(selectedChannel.subscriber_count) : "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">Subscribers</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {selectedChannel.view_count ? formatNumber(selectedChannel.view_count) : "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">Views</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {selectedChannel.video_count || "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">Videos</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {selectedChannel.country || "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">Country</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-3">
                {selectedChannel.created_date && (
                  <div>
                    <h4 className="font-semibold mb-1">Created</h4>
                    <p className="text-muted-foreground">
                      {new Date(selectedChannel.created_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {selectedChannel.description && (
                  <div>
                    <h4 className="font-semibold mb-1">Description</h4>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {selectedChannel.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Termination Warning */}
              {selectedChannel.is_terminated && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This channel has been terminated by YouTube.
                    {selectedChannel.termination_reason && (
                      <span> Reason: {selectedChannel.termination_reason}</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleAddChannel(selectedChannel)}
                  disabled={existingChannels.includes(selectedChannel.channel_id) || isAdding}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Channel
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


