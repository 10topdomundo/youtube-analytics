import { NextResponse } from "next/server"
import { databaseService } from "@/lib/database-service"

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log("=== Recalculating Metrics for DashieGames ===")
    
    const channelId = "UCERUmrDh9hmqEXBsnYFNTIA"
    const metrics = await databaseService.calculateChannelMetrics(channelId)
    
    console.log("Calculated metrics:", metrics)
    
    return NextResponse.json({
      success: true,
      channelId: channelId,
      metrics: metrics
    })
    
  } catch (error) {
    console.error("Recalculation error:", error)
    return NextResponse.json({ 
      error: "Failed to recalculate metrics", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}






