import { type NextRequest, NextResponse } from "next/server"
import { databaseService } from "@/lib/database-service"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log("=== Table Data API Debug ===")
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

    const tableData = channels.map((channel) => ({
      id: channel.id,
      channel_name: channel.channel_name,
      channel_niche: channel.channel_niche || "",
      channel_language: channel.channel_language || "",
      // Add total statistics for channel management display
      total_subscribers: channel.statistics?.total_subscribers || 0,
      total_views: channel.statistics?.total_views || 0,
      total_uploads: channel.statistics?.total_uploads || 0,
      views_last_30d: channel.calculated.views_last_30_days,
      views_delta_30d: channel.calculated.views_delta_30_days,
      views_delta_7d: channel.calculated.views_delta_7_days,
      views_delta_3d: channel.calculated.views_delta_3_days,
      views_per_subscriber: channel.calculated.views_per_subscriber,
      uploads_last_30d: channel.calculated.uploads_last_30_days,
      videos_until_takeoff: channel.calculated.videos_until_takeoff || 0,
      days_until_takeoff: channel.calculated.days_until_takeoff || 0,
      days_creation_to_first_upload: channel.calculated.days_creation_to_first_upload || 0,
      sub_niche: channel.sub_niche || "",
      channel_type: channel.channel_type || "",
      channel_creation: channel.channel_created_date || "",
      thumbnail_style: channel.thumbnail_style || "",
      video_style: channel.video_style || "",
      video_length: channel.video_length || "",
      status: channel.status || "Active",
      notes: channel.notes || "",
      channel_id: channel.channel_id,
      // Include custom fields if they exist
      ...(channel.custom_fields || {}),
    }))

    console.log("Table data sample:", tableData.length > 0 ? {
      id: tableData[0].id,
      channel_name: tableData[0].channel_name,
      total_subscribers: tableData[0].total_subscribers,
      total_views: tableData[0].total_views
    } : "No data")
    console.log("=== End Table Data API Debug ===")

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
          channel_niche: row.channel_niche,
          channel_language: row.channel_language,
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
          "channel_name",
          "channel_niche",
          "channel_language",
          "views_last_30d", // Read-only calculated field
          "views_delta_30d", // Read-only calculated field
          "views_delta_7d", // Read-only calculated field
          "views_delta_3d", // Read-only calculated field
          "views_per_subscriber", // Read-only calculated field
          "uploads_last_30d", // Read-only calculated field
          "videos_until_takeoff", // Read-only calculated field
          "days_until_takeoff", // Read-only calculated field
          "days_creation_to_first_upload", // Read-only calculated field
          "sub_niche",
          "channel_type",
          "channel_creation",
          "thumbnail_style",
          "video_style",
          "video_length",
          "status",
          "notes",
          "channel_id",
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Table data update API error:", error)
    return NextResponse.json({ error: "Failed to update table data" }, { status: 500 })
  }
}
