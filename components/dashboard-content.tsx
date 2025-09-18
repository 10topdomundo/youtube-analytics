"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { ChannelManagement } from "@/components/channel-management"
import { ChannelInsights } from "@/components/channel-insights"
import { DataVisualizations } from "@/components/data-visualizations"
import { SocialBladeIntegration } from "@/components/socialblade-integration"
import { ChannelDataTable } from "@/components/channel-data-table"
import { DashboardHeader } from "@/components/dashboard-header"
import { BarChart3, TrendingUp, Users, Database, Table } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import type { UserProfile } from "@/lib/auth"

interface DashboardContentProps {
  user: User
  profile: UserProfile | null
}

export function DashboardContent({ user, profile }: DashboardContentProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} profile={profile} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">YouTube Analytics Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive YouTube channel analytics powered by SocialBlade
          </p>
        </div>

        {/* Main Navigation */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="visualizations" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              Data Table
            </TabsTrigger>
            <TabsTrigger value="integration" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Integration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="channels">
            <ChannelManagement isAdmin={profile?.is_admin || false} />
          </TabsContent>

          <TabsContent value="insights">
            <ChannelInsights />
          </TabsContent>

          <TabsContent value="visualizations">
            <DataVisualizations />
          </TabsContent>

          <TabsContent value="table">
            <ChannelDataTable isAdmin={profile?.is_admin || false} />
          </TabsContent>

          <TabsContent value="integration">
            <SocialBladeIntegration />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
