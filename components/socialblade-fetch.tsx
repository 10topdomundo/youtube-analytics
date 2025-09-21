"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Download, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  ExternalLink,
  Info
} from "lucide-react"

interface FetchResult {
  success: boolean
  channel?: any
  socialBladeData?: any
  apiInfo?: {
    access: {
      seconds_to_expire: number
    }
    credits: {
      available: number
    }
  }
  message?: string
  error?: string
}

export function SocialBladeFetch() {
  const [query, setQuery] = useState("")
  const [history, setHistory] = useState("default")
  const [allowStale, setAllowStale] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<FetchResult | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleFetch = async () => {
    if (!query.trim()) {
      setResult({
        success: false,
        error: "Please enter a channel ID, username, or handle"
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/socialblade/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          history,
          allowStale,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || `HTTP ${response.status}`,
        })
        return
      }

      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCreditCost = (historyType: string) => {
    switch (historyType) {
      case "default": return 1
      case "extended": return 2
      case "archive": return 3
      default: return 1
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Fetch Channel Data
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Import channel data from SocialBlade API
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="w-4 h-4 mr-2" />
                API Info
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>SocialBlade API Information</DialogTitle>
                <DialogDescription>
                  Learn how to use the SocialBlade integration
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Query Formats</h4>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <div><code>UCxxxxxxxxxxxxxxxxxxxxxxx</code> - Channel ID (preferred)</div>
                    <div><code>username</code> - Username</div>
                    <div><code>@handle</code> - Handle (include @ symbol)</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">History Options</h4>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <div><Badge variant="outline">Default (1 credit)</Badge> - Up to 30 days</div>
                    <div><Badge variant="outline">Extended (2 credits)</Badge> - Up to 1 year</div>
                    <div><Badge variant="outline">Archive (3 credits)</Badge> - Up to 3 years</div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="query">Channel Query</Label>
            <Input
              id="query"
              placeholder="Channel ID, username, or @handle"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Examples: UCxxxxxxx, username, @handle
            </p>
          </div>

          <div className="space-y-2">
            <Label>History Range</Label>
            <Select value={history} onValueChange={setHistory} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  Default (1 credit) - 30 days
                </SelectItem>
                <SelectItem value="extended">
                  Extended (2 credits) - 1 year
                </SelectItem>
                <SelectItem value="archive">
                  Archive (3 credits) - 3 years
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allow-stale"
              checked={allowStale}
              onChange={(e) => setAllowStale(e.target.checked)}
              disabled={isLoading}
              className="rounded"
            />
            <Label htmlFor="allow-stale" className="text-sm">
              Allow stale data
            </Label>
          </div>
          
          <Button onClick={handleFetch} disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Fetch Data ({getCreditCost(history)} credit{getCreditCost(history) > 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Fetching channel data...</span>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          </div>
        )}

        {result && (
          <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  {result.success ? (
                    <div className="space-y-2">
                      <div className="font-medium text-green-800">
                        {result.message}
                      </div>
                      {result.channel && (
                        <div className="text-sm text-green-700">
                          <div><strong>Channel:</strong> {result.channel.channel_name}</div>
                          <div><strong>ID:</strong> {result.channel.channel_id}</div>
                          {result.channel.channel_handle && (
                            <div><strong>Handle:</strong> {result.channel.channel_handle}</div>
                          )}
                        </div>
                      )}
                      {result.apiInfo && (
                        <div className="flex items-center gap-4 text-xs text-green-600">
                          <span>Credits remaining: {result.apiInfo.credits.available}</span>
                          <span>Expires in: {Math.round(result.apiInfo.access.seconds_to_expire / 60)} min</span>
                        </div>
                      )}
                      {result.socialBladeData && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDetails(!showDetails)}
                          className="mt-2"
                        >
                          {showDetails ? "Hide" : "Show"} Details
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="font-medium text-red-800">
                      {result.error}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {showDetails && result?.socialBladeData && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">SocialBlade Data Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Statistics</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <div>Subscribers: {result.socialBladeData.statistics.total.subscribers.toLocaleString()}</div>
                    <div>Views: {result.socialBladeData.statistics.total.views.toLocaleString()}</div>
                    <div>Uploads: {result.socialBladeData.statistics.total.uploads.toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Rankings</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <div>SB Rank: #{result.socialBladeData.ranks.sbrank.toLocaleString()}</div>
                    <div>Country Rank: #{result.socialBladeData.ranks.country.toLocaleString()}</div>
                    <div>Category Rank: #{result.socialBladeData.ranks.channel_type.toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Channel Info</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <div>Created: {new Date(result.socialBladeData.general.created_at).toLocaleDateString()}</div>
                    <div>Type: {result.socialBladeData.general.channel_type}</div>
                    <div>Country: {result.socialBladeData.general.geo.country}</div>
                    <div>Grade: {result.socialBladeData.misc.grade.grade}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Growth (30 days)</h4>
                  <div className="space-y-1 text-muted-foreground">
                    <div>Subscribers: {result.socialBladeData.statistics.growth.subs['30']?.toLocaleString() || 'N/A'}</div>
                    <div>Views: {result.socialBladeData.statistics.growth.vidviews['30']?.toLocaleString() || 'N/A'}</div>
                  </div>
                </div>
              </div>
              {result.socialBladeData.daily && result.socialBladeData.daily.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Daily Data</h4>
                  <p className="text-xs text-muted-foreground">
                    {result.socialBladeData.daily.length} days of historical data imported
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}


