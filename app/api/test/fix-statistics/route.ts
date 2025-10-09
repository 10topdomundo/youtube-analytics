import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const adminSupabase = createAdminClient()
    
    console.log("=== Fixing Statistics Data ===")
    
    // Update DashieGames statistics to use null instead of 0 for likes/comments
    const { data: channel } = await adminSupabase
      .from("channels")
      .select("id")
      .eq("channel_id", "UCERUmrDh9hmqEXBsnYFNTIA")
      .single()
    
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }
    
    const { error: updateError } = await adminSupabase
      .from("channel_statistics")
      .update({
        total_likes: null,
        total_comments: null
      })
      .eq("channel_id", channel.id)
    
    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json({ error: "Failed to update statistics" }, { status: 500 })
    }
    
    // Also update daily stats to use null for video_uploads and estimated_earnings
    const { error: dailyUpdateError } = await adminSupabase
      .from("channel_daily_stats")
      .update({
        video_uploads: null,
        estimated_earnings: null
      })
      .eq("channel_id", channel.id)
    
    if (dailyUpdateError) {
      console.error("Daily stats update error:", dailyUpdateError)
    }
    
    console.log("Statistics fixed successfully")
    
    return NextResponse.json({
      success: true,
      message: "Statistics data fixed - likes/comments set to null, daily uploads set to null"
    })
    
  } catch (error) {
    console.error("Fix statistics error:", error)
    return NextResponse.json({ 
      error: "Failed to fix statistics", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}









