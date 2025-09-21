import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import SocialBlade from 'socialblade'

export const dynamic = 'force-dynamic'

interface SocialBladeResponse {
  status: {
    success: boolean
    status: number
    error?: string
  }
  info?: {
    access: {
      seconds_to_expire: number
    }
    credits: {
      available: number
    }
  }
  data?: {
    id: {
      id: string
      username?: string
      display_name: string
      cusername?: string
      handle?: string
    }
    general: {
      created_at: string
      channel_type: string
      geo: {
        country_code: string
        country: string
      }
      branding: {
        avatar: string
        banner?: string
        website: string
        social: {
          facebook?: string
          twitter?: string
          twitch?: string
          instagram?: string
          linkedin?: string
          discord?: string
          tiktok?: string
        }
      }
    }
    statistics: {
      total: {
        uploads: number
        subscribers: number
        views: number
      }
      growth: {
        subs: {
          [key: string]: number
        }
        vidviews: {
          [key: string]: number
        }
      }
    }
    misc: {
      grade: {
        color: string
        grade: string
      }
      sb_verified: boolean
      made_for_kids: boolean
    }
    ranks: {
      sbrank: number
      subscribers: number
      views: number
      country: number
      channel_type: number
    }
    daily: Array<{
      date: string
      subs: number
      views: number
    }>
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { query, history = "default" } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    console.log("=== SocialBlade Request Parameters ===")
    console.log("Query:", query)
    console.log("History:", history)
    console.log("Query Type:", 
      query.startsWith("UC") ? "Channel ID" :
      query.startsWith("@") ? "Handle" : 
      "Username/Custom Username"
    )

    // Check environment variables
    const clientId = process.env.SOCIALBLADE_CLIENT_ID
    const clientSecret = process.env.SOCIALBLADE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: "SocialBlade API credentials not configured" 
      }, { status: 500 })
    }

    // Initialize SocialBlade client
    const client: SocialBlade = new SocialBlade(clientId, clientSecret)

    console.log("=== SocialBlade API Call Debug ===")
    console.log("Query:", query)
    console.log("Client ID configured:", !!clientId)
    console.log("Client Secret configured:", !!clientSecret)

    // Get YouTube user data with history parameter
    let rawResponse: any
    try {
      console.log("Fetching YouTube user data for:", query)
      console.log("Using history option:", history)
      
      // Call SocialBlade API - try with and without history parameter
      try {
        rawResponse = await client.youtube.user(query, history)
      } catch (historyError) {
        console.log("Failed with history parameter, trying without:", historyError)
        // Fallback to basic call without history parameter
        rawResponse = await client.youtube.user(query)
      }
      
      console.log("Raw SocialBlade response:", rawResponse)
    } catch (error) {
      console.error("SocialBlade API call failed:", error)
      
      // Check if it's a channel not found error
      if (error instanceof Error && (
        error.message.includes('404') || 
        error.message.includes('not found') ||
        error.message.includes('undefined')
      )) {
        return NextResponse.json({
          error: "Channel not found or may be terminated",
          details: error.message
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: "SocialBlade API call failed: " + (error instanceof Error ? error.message : "Unknown error")
      }, { status: 500 })
    }

    console.log("=== SocialBlade API Response ===")
    console.log("Response received:", !!rawResponse)
    console.log("Response keys:", rawResponse ? Object.keys(rawResponse) : "No response")
    console.log("=== End SocialBlade Response ===")

    if (!rawResponse) {
      return NextResponse.json({ 
        error: "No data returned from SocialBlade" 
      }, { status: 404 })
    }

    // The socialblade npm package returns data directly, not wrapped in a status object
    // So we need to adapt it to our expected format
    const sbUser = {
      status: { success: true, status: 200 },
      data: rawResponse,
      info: { 
        access: { seconds_to_expire: 3600 },
        credits: { available: 1000 }
      }
    }

    // Map SocialBlade data to our database structure
    const channelData = {
      channel_id: sbUser.data.id.id,
      channel_name: sbUser.data.id.display_name,
      channel_handle: sbUser.data.id.handle,
      channel_description: null, // Not provided by SocialBlade
      channel_thumbnail_url: sbUser.data.general.branding.avatar,
      channel_banner_url: sbUser.data.general.branding.banner,
      channel_country: sbUser.data.general.geo.country,
      channel_language: null, // Not provided by SocialBlade
      channel_created_date: new Date(sbUser.data.general.created_at).toISOString(),
      channel_keywords: null, // Not provided by SocialBlade
      
      // SocialBlade specific fields
      username: sbUser.data.id.username,
      cusername: sbUser.data.id.cusername,
      channel_type: sbUser.data.general.channel_type,
      country_code: sbUser.data.general.geo.country_code,
      website: sbUser.data.general.branding.website,
      grade_color: sbUser.data.misc.grade.color,
      grade: sbUser.data.misc.grade.grade,
      sb_verified: sbUser.data.misc.sb_verified,
      made_for_kids: sbUser.data.misc.made_for_kids,
      
      // Social links (JSON)
      social_links: sbUser.data.general.branding.social,
    }

    // Insert or update channel data
    const { data: channel, error: channelError } = await adminSupabase
      .from("channels")
      .upsert(channelData, { 
        onConflict: "channel_id",
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (channelError) {
      console.error("Channel insert error:", channelError)
      return NextResponse.json({ 
        error: "Failed to save channel data: " + channelError.message 
      }, { status: 500 })
    }

    // Insert current statistics
    const statisticsData = {
      channel_id: channel.id,
      total_uploads: sbUser.data.statistics.total.uploads,
      total_subscribers: sbUser.data.statistics.total.subscribers,
      total_views: sbUser.data.statistics.total.views,
      total_likes: null, // Not provided by SocialBlade - use null instead of 0
      total_comments: null, // Not provided by SocialBlade - use null instead of 0
      snapshot_date: new Date().toISOString(),
    }

    const { error: statsError } = await adminSupabase
      .from("channel_statistics")
      .insert(statisticsData)

    if (statsError) {
      console.error("Statistics insert error:", statsError)
      // Don't fail the whole operation for stats error
    }

    // Insert ranking data
    const ranksData = {
      channel_id: channel.id,
      subscriber_rank: sbUser.data.ranks.subscribers,
      video_view_rank: sbUser.data.ranks.views,
      country_rank: sbUser.data.ranks.country,
      category_rank: sbUser.data.ranks.channel_type,
      global_rank: sbUser.data.ranks.sbrank,
      rank_date: new Date().toISOString(),
    }

    const { error: ranksError } = await adminSupabase
      .from("channel_ranks")
      .insert(ranksData)

    if (ranksError) {
      console.error("Ranks insert error:", ranksError)
      // Don't fail the whole operation for ranks error
    }

    // Insert daily statistics if available
    if (sbUser.data.daily && sbUser.data.daily.length > 0) {
      const dailyData = sbUser.data.daily.map((day: { date: string; subs: number; views: number }) => ({
        channel_id: channel.id,
        date: day.date,
        subscribers: day.subs,
        views: day.views,
        video_uploads: null, // SocialBlade doesn't provide daily upload counts
        estimated_earnings: null, // SocialBlade doesn't provide earnings data
      }))

      const { error: dailyError } = await adminSupabase
        .from("channel_daily_stats")
        .upsert(dailyData, { 
          onConflict: "channel_id,date",
          ignoreDuplicates: false 
        })

      if (dailyError) {
        console.error("Daily stats insert error:", dailyError)
        // Don't fail the whole operation for daily stats error
      }
    }

    // Return success with the channel data and API info
    return NextResponse.json({
      success: true,
      channel: channel,
      socialBladeData: sbUser.data,
      apiInfo: sbUser.info,
      message: "Channel data fetched and saved successfully"
    })

  } catch (error) {
    console.error("SocialBlade fetch error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch channel data: " + (error instanceof Error ? error.message : "Unknown error")
    }, { status: 500 })
  }
}
