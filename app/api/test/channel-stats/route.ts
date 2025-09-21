import { NextResponse } from "next/server"
import { databaseService } from "@/lib/database-service"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log("=== Testing Channel Statistics Retrieval ===")
    
    // Test getting all channels
    const channels = await databaseService.getAllChannels()
    console.log("All channels:", channels.length)
    
    // Test getting statistics for each channel
    const results = []
    for (const channel of channels) {
      console.log(`Testing channel: ${channel.channel_name} (${channel.channel_id})`)
      
      const statistics = await databaseService.getChannelStatistics(channel.channel_id)
      const dailyStats = await databaseService.getChannelDailyStats(channel.channel_id, 7)
      
      results.push({
        channel_id: channel.channel_id,
        channel_name: channel.channel_name,
        statistics: statistics,
        dailyStatsCount: dailyStats.length,
        latestDailyStats: dailyStats[dailyStats.length - 1] || null
      })
      
      console.log(`  - Statistics: ${statistics ? 'Found' : 'Not found'}`)
      console.log(`  - Daily stats: ${dailyStats.length} records`)
      if (statistics) {
        console.log(`  - Subscribers: ${statistics.total_subscribers}`)
        console.log(`  - Views: ${statistics.total_views}`)
      }
    }
    
    console.log("=== End Test ===")
    
    return NextResponse.json({
      success: true,
      totalChannels: channels.length,
      results: results
    })
    
  } catch (error) {
    console.error("Test API error:", error)
    return NextResponse.json({ 
      error: "Test failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
