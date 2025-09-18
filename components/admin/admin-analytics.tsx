"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Database, Activity, TrendingUp } from "lucide-react"

interface SystemStats {
  totalUsers: number
  adminUsers: number
  totalChannels: number
  activeChannels: number
  recentSignups: number
  systemHealth: "healthy" | "warning" | "error"
}

export function AdminAnalytics() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    adminUsers: 0,
    totalChannels: 0,
    activeChannels: 0,
    recentSignups: 0,
    systemHealth: "healthy",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for now - replace with actual API calls
    setTimeout(() => {
      setStats({
        totalUsers: 24,
        adminUsers: 3,
        totalChannels: 156,
        activeChannels: 142,
        recentSignups: 5,
        systemHealth: "healthy",
      })
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return <div className="flex justify-center p-8">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Analytics</h2>
        <p className="text-muted-foreground">Overview of system performance and usage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.adminUsers} admins, {stats.totalUsers - stats.adminUsers} regular users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Channels</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChannels}</div>
            <p className="text-xs text-muted-foreground">{stats.activeChannels} active channels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentSignups}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={stats.systemHealth === "healthy" ? "default" : "destructive"} className="text-xs">
                {stats.systemHealth.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Recent user registrations and activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                User activity metrics would be displayed here with charts and graphs showing login patterns, user
                engagement, and growth trends.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel Performance</CardTitle>
            <CardDescription>Overview of channel data and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Channel performance metrics would be displayed here including view counts, subscriber growth, and
                content upload patterns.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
