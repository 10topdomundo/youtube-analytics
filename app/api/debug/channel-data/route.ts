import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get all channels
    const { data: channels, error: channelsError } = await supabase
      .from("channels")
      .select("*")
      .order("created_at", { ascending: false })

    if (channelsError) {
      console.error("Channels error:", channelsError)
      return NextResponse.json({ error: "Failed to fetch channels", details: channelsError }, { status: 500 })
    }

    // Get all channel statistics
    const { data: statistics, error: statsError } = await supabase
      .from("channel_statistics")
      .select("*")
      .order("snapshot_date", { ascending: false })

    if (statsError) {
      console.error("Statistics error:", statsError)
    }

    // Get all daily stats
    const { data: dailyStats, error: dailyError } = await supabase
      .from("channel_daily_stats")
      .select("*")
      .order("date", { ascending: false })
      .limit(10)

    if (dailyError) {
      console.error("Daily stats error:", dailyError)
    }

    return NextResponse.json({
      channels: {
        count: channels?.length || 0,
        data: channels || []
      },
      statistics: {
        count: statistics?.length || 0,
        data: statistics || []
      },
      dailyStats: {
        count: dailyStats?.length || 0,
        data: dailyStats || []
      },
      errors: {
        channels: channelsError,
        statistics: statsError,
        dailyStats: dailyError
      }
    })

  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch debug data", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
