"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardHeader } from "@/components/dashboard-header"
import { UserManagement } from "@/components/admin/user-management"
import { AdminAnalytics } from "@/components/admin/admin-analytics"
import { DashboardContent } from "@/components/dashboard-content"
import { Users, BarChart3, Shield, Database } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import type { UserProfile } from "@/lib/auth"

interface AdminDashboardProps {
  user: User
  profile: UserProfile
}

export function AdminDashboard({ user, profile }: AdminDashboardProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} profile={profile} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage users, monitor system analytics, and oversee YouTube channel data
          </p>
        </div>

        {/* Admin Navigation */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              System Analytics
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Channel Data
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Regular Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="channels">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Channel Data Management</h2>
              <DashboardContent user={user} profile={profile} hideHeader={true} />
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            <DashboardContent user={user} profile={profile} hideHeader={true} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
