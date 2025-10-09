import { type NextRequest, NextResponse } from "next/server"
import { ChannelService } from "@/lib/channel-service"
import { databaseService } from "@/lib/database-service"

export const dynamic = 'force-dynamic'

// Simple in-memory cache for channels with 1-minute duration
let channelsCache: { data: any, timestamp: number } | null = null
const CACHE_DURATION = 60 * 1000 // 1 minute

export async function GET(request: NextRequest) {
  try {
    // Check for pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const withMetrics = searchParams.get('withMetrics') === 'true'

    // Create cache key based on pagination params
    const cacheKey = `channels-page${page}-limit${limit}-metrics${withMetrics}`
    
    // Check cache first
    const now = Date.now()
    if (channelsCache && (now - channelsCache.timestamp) < CACHE_DURATION) {
      console.log("Returning cached channels data")
      return NextResponse.json(channelsCache.data)
    }

    console.log(`Fetching channels data - page: ${page}, limit: ${limit}, withMetrics: ${withMetrics}`)
    
    let result
    if (withMetrics) {
      // Fetch paginated channels with metrics
      const { channels, total, totalPages } = await databaseService.getChannelsWithMetricsPaginated(page, limit)
      result = {
        channels,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    } else {
      // Fetch paginated channels without metrics (faster)
      const { channels, total } = await databaseService.getChannelsPaginated(page, limit)
      result = {
        channels,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }
    
    // Cache the result
    channelsCache = {
      data: result,
      timestamp: now
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to fetch channels:", error)
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const channelData = await request.json()
    await ChannelService.addChannel(channelData)
    
    // Invalidate cache after adding channel
    channelsCache = null
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to add channel:", error)
    return NextResponse.json({ error: "Failed to add channel" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { channelId, ...updates } = await request.json()
    await ChannelService.updateChannel(channelId, updates)
    
    // Invalidate cache after updating channel
    channelsCache = null
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update channel:", error)
    return NextResponse.json({ error: "Failed to update channel" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
    }

    await ChannelService.deleteChannel(channelId)
    
    // Invalidate cache after deleting channel
    channelsCache = null
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete channel:", error)
    return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 })
  }
}
