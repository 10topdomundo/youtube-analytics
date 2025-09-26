"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { ChannelManagement } from "@/components/channel-management"
import { ChannelInsights } from "@/components/channel-insights"
import { DataVisualizations } from "@/components/data-visualizations"
import { ChannelDataTable } from "@/components/channel-data-table"
import { FolderManagement } from "@/components/folder-management"
import { AgeAnalyticsDashboard } from "@/components/age-analytics-dashboard"
import { TopNichesDashboard } from "@/components/top-niches-dashboard"
import { DashboardHeader } from "@/components/dashboard-header"
import { BarChart3, TrendingUp, Users, Table, Folder, PieChart, Crown } from "lucide-react"
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
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="top-niches" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Top Niches</span>
            </TabsTrigger>
            <TabsTrigger value="folders" className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              <span className="hidden sm:inline">Folders</span>
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Channels</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </TabsTrigger>
            <TabsTrigger value="age-analytics" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Age Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="visualizations" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Charts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="top-niches">
            <TopNichesDashboard />
          </TabsContent>

          <TabsContent value="folders">
            <FolderManagement isAdmin={profile?.role === "admin" || false} />
          </TabsContent>

          <TabsContent value="channels">
            <ChannelManagement isAdmin={profile?.role === "admin" || false} />
          </TabsContent>

          <TabsContent value="table">
            <ChannelDataTable 
              isAdmin={profile?.role === "admin" || false}
            />
          </TabsContent>

          <TabsContent value="age-analytics">
            <AgeAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="insights">
            <ChannelInsights />
          </TabsContent>

          <TabsContent value="visualizations">
            <DataVisualizations />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
