import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication and admin status
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to check admin status
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get total users count
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    // Get admin users count
    const { count: adminUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin")

    // Get total channels count
    const { count: totalChannels } = await supabase
      .from("channels")
      .select("*", { count: "exact", head: true })

    // Get active channels count (channels with recent statistics)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: activeChannels } = await supabase
      .from("channel_statistics")
      .select("channel_id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString())

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: recentSignups } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString())

    // Get recent channel statistics for system health check
    const { data: recentStats } = await supabase
      .from("channel_statistics")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .limit(1)

    // Determine system health based on recent activity
    let systemHealth: "healthy" | "warning" | "error" = "healthy"
    if (!recentStats || recentStats.length === 0) {
      systemHealth = "warning"
    }

    // Get user growth data for the last 30 days
    const { data: userGrowthData } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true })

    // Get channel growth data for the last 30 days
    const { data: channelGrowthData } = await supabase
      .from("channels")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true })

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      adminUsers: adminUsers || 0,
      totalChannels: totalChannels || 0,
      activeChannels: activeChannels || 0,
      recentSignups: recentSignups || 0,
      systemHealth,
      userGrowthData: userGrowthData || [],
      channelGrowthData: channelGrowthData || [],
    })

  } catch (error) {
    console.error("Admin analytics error:", error)
    return NextResponse.json({
      error: "Failed to fetch analytics data"
    }, { status: 500 })
  }
}









