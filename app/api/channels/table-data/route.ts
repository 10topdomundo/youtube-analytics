import { type NextRequest, NextResponse } from "next/server"
import { databaseService } from "@/lib/database-service"

export const dynamic = 'force-dynamic'

// Simple in-memory cache for table data
let tableDataCache: any = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  try {
    console.log("=== Table Data API Debug ===")
    
    // Check cache first
    const now = Date.now()
    if (tableDataCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log("Returning cached table data")
      return NextResponse.json(tableDataCache)
    }

    console.log("Fetching fresh table data...")
    const channels = await databaseService.getAllChannelsWithMetrics()
    console.log("Channels fetched:", channels.length)
    
    if (channels.length > 0) {
      console.log("Sample channel:", {
        id: channels[0].id,
        channel_id: channels[0].channel_id,
        channel_name: channels[0].channel_name,
        statistics: channels[0].statistics,
        calculated: channels[0].calculated
      })
    }

    const tableData = channels.map((channel) => {
      // Calculate age classification based on creation date
      let ageClassification = "unknown"
      if (channel.channel_created_date) {
        const creationYear = new Date(channel.channel_created_date).getFullYear()
        if (creationYear >= 2023) {
          ageClassification = "fresh"
        } else if (creationYear <= 2022) {
          ageClassification = "aged"
        }
      }

      return {
        // Core identification
        channel_id: channel.channel_id,
        channel_name: channel.channel_name,
        
        // Categorization (editable)
        niche: channel.channel_niche || "",
        sub_niche: channel.sub_niche || "",
        channel_type: ageClassification, // Auto-populated based on creation date
        language: channel.channel_language || "",
      
      // Statistics (from database)
      total_subscribers: channel.statistics?.total_subscribers || 0,
      total_views: channel.statistics?.total_views || 0,
      total_uploads: channel.statistics?.total_uploads || 0,
      
      // Analytics (calculated)
      views_last_30_days: channel.calculated?.views_last_30_days || 0,
      views_delta_30_days: channel.calculated?.views_delta_30_days ? 
        `${channel.calculated.views_delta_30_days.toFixed(1)}%` : "0%",
      views_delta_7_days: channel.calculated?.views_delta_7_days ? 
        `${channel.calculated.views_delta_7_days.toFixed(1)}%` : "0%",
      views_delta_3_days: channel.calculated?.views_delta_3_days ? 
        `${channel.calculated.views_delta_3_days.toFixed(1)}%` : "0%",
      views_per_subscriber: channel.calculated?.views_per_subscriber || 0,
      
      // Note: SocialBlade doesn't provide upload frequency data
      // videos_uploaded_last_30_days: Not available from SocialBlade API
      
      // Removed assumption-based fields that were incorrectly calculated
      
      // Channel info (editable)
      channel_creation: channel.channel_created_date ? 
        new Date(channel.channel_created_date).toLocaleDateString() : "",
      thumbnail_style: channel.thumbnail_style || "",
      video_style: channel.video_style || "",
      video_length: channel.video_length || "",
      status: channel.status || "Active",
      notes: channel.notes || "",
      
      // Internal fields for editing
      id: channel.id,
      
      // Include custom fields if they exist
      ...(channel.custom_fields || {})
    }
    })

    console.log("Table data sample:", tableData.length > 0 ? {
      id: tableData[0].id,
      channel_name: tableData[0].channel_name,
      total_subscribers: tableData[0].total_subscribers,
      total_views: tableData[0].total_views
    } : "No data")
    console.log("=== End Table Data API Debug ===")

    // Cache the result
    tableDataCache = tableData
    cacheTimestamp = now

    return NextResponse.json(tableData)
  } catch (error) {
    console.error("Table data API error:", error)
    return NextResponse.json({ error: "Failed to load table data" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { data } = await request.json()

    for (const row of data) {
      if (row.channel_id) {
        const standardFields = {
          channel_name: row.channel_name,
          channel_niche: row.niche,
          channel_language: row.language,
          sub_niche: row.sub_niche,
          channel_type: row.channel_type,
          thumbnail_style: row.thumbnail_style,
          video_style: row.video_style,
          video_length: row.video_length,
          status: row.status,
          notes: row.notes,
        }

        // Extract custom fields (any field not in the standard set)
        const standardFieldNames = new Set([
          "id",
          "channel_id",
          "channel_name",
          "niche",
          "language",
          "sub_niche",
          "channel_type",
          // Read-only statistics fields
          "total_subscribers",
          "total_views", 
          "total_uploads",
          // Read-only calculated fields
          "views_last_30_days",
          "views_delta_30_days",
          "views_delta_7_days", 
          "views_delta_3_days",
          "views_per_subscriber",
          // Editable fields
          "channel_creation",
          "thumbnail_style",
          "video_style",
          "video_length",
          "status",
          "notes",
        ])

        const customFields: Record<string, any> = {}
        for (const [key, value] of Object.entries(row)) {
          if (!standardFieldNames.has(key)) {
            customFields[key] = value
          }
        }

        await databaseService.updateChannel(row.channel_id, {
          ...standardFields,
          custom_fields: customFields,
        })
      }
    }

    // Invalidate cache after updates
    tableDataCache = null
    cacheTimestamp = 0

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Table data update API error:", error)
    return NextResponse.json({ error: "Failed to update table data" }, { status: 500 })
  }
}
