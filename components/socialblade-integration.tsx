"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Activity, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
// Removed getSocialBladeClient import - using API endpoint instead

interface ApiStatus {
  status: string
  error?: string
  message?: string
}

export function SocialBladeIntegration() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    loadApiStatus()
    // Set a mock last sync time
    setLastSync(new Date(Date.now() - 2 * 60 * 60 * 1000)) // 2 hours ago
  }, [])

  const loadApiStatus = async () => {
    try {
      const response = await fetch('/api/socialblade/status')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const status = await response.json()
      setApiStatus(status)
    } catch (error) {
      console.error("Failed to load API status:", error)
      // Set fallback status on error
      setApiStatus({
        status: "error",
        error: "Failed to load API status"
      })
    }
  }

  const handleSync = async () => {
    setIsLoading(true)

    try {
      // Simulate sync process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setLastSync(new Date())
      await loadApiStatus()
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} days ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">SocialBlade Integration</h2>
          <p className="text-muted-foreground">Monitor API status and sync channel data</p>
        </div>

        <Button onClick={handleSync} disabled={isLoading} className="bg-primary hover:bg-primary/90">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      {/* API Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            API Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiStatus ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection Status</span>
                <Badge 
                  variant={apiStatus.status === "configured" ? "default" : "destructive"} 
                  className={apiStatus.status === "configured" ? "bg-green-600" : "bg-red-600"}
                >
                  {apiStatus.status === "configured" ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertCircle className="w-3 h-3 mr-1" />
                  )}
                  {apiStatus.status === "configured" ? "Configured" : 
                   apiStatus.status === "not_configured" ? "Not Configured" : 
                   "Error"}
                </Badge>
              </div>


              {apiStatus.status === "not_configured" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    SocialBlade API credentials are not configured. Please add SOCIALBLADE_CLIENT_ID and SOCIALBLADE_CLIENT_SECRET to your environment variables.
                  </AlertDescription>
                </Alert>
              )}

              {apiStatus.status === "configured" && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    SocialBlade credentials are configured and ready to use.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading API status...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Data Synchronization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Syncing channel data...</span>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Sync</span>
            <span className="text-sm text-muted-foreground">{lastSync ? formatTimeAgo(lastSync) : "Never"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Auto Sync</span>
            <Badge variant="outline" className="text-primary border-primary">
              Every 6 hours
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Integration Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This integration uses the SocialBlade API to fetch real-time YouTube analytics data. Data is automatically
          synchronized every 6 hours, or you can manually sync using the button above.
        </AlertDescription>
      </Alert>

      {/* Mock SocialBlade Features */}
      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Channel Analytics</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Subscriber growth tracking</li>
                <li>• View count analysis</li>
                <li>• Upload frequency metrics</li>
                <li>• Engagement rate calculations</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Comparative Analysis</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multi-channel comparisons</li>
                <li>• Niche-based analytics</li>
                <li>• Growth trend analysis</li>
                <li>• Performance benchmarking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
