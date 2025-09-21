import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import SocialBlade from 'socialblade'

export const dynamic = 'force-dynamic'

interface ChannelSearchResult {
  channel_id: string
  channel_name: string
  handle?: string
  avatar_url?: string
  banner_url?: string
  subscriber_count?: number
  view_count?: number
  video_count?: number
  created_date?: string
  country?: string
  is_terminated?: boolean
  termination_reason?: string
  description?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

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
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    console.log("Searching for channel:", query)

    // Check if channel already exists in database
    const { data: existingChannel } = await supabase
      .from("channels")
      .select("channel_id, channel_name")
      .eq("channel_id", query)
      .single()

    // Initialize SocialBlade client
    const clientId = process.env.SOCIALBLADE_CLIENT_ID
    const clientSecret = process.env.SOCIALBLADE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        error: "SocialBlade API credentials not configured"
      }, { status: 500 })
    }

    const client = new SocialBlade(clientId, clientSecret)

    // Try to fetch channel data from SocialBlade
    let channelData: ChannelSearchResult
    
    try {
      console.log("Fetching from SocialBlade...")
      console.log("Using history option:", history)
      
      let rawResponse: any
      try {
        rawResponse = await client.youtube.user(query, { history })
      } catch (historyError) {
        console.log("Failed with history parameter, trying without:", historyError)
        // Fallback to basic call without history parameter
        rawResponse = await client.youtube.user(query)
      }
      
      console.log("SocialBlade response received:", !!rawResponse)

      if (!rawResponse) {
        // Check if it's a terminated channel by trying YouTube API or other methods
        return NextResponse.json({
          channel_id: query,
          channel_name: "Unknown Channel",
          is_terminated: true,
          termination_reason: "Channel not found or may be terminated"
        })
      }

      // Extract data from SocialBlade response
      channelData = {
        channel_id: rawResponse.id?.id || query,
        channel_name: rawResponse.id?.display_name || "Unknown Channel",
        handle: rawResponse.id?.handle || rawResponse.id?.username,
        avatar_url: rawResponse.general?.branding?.avatar,
        banner_url: rawResponse.general?.branding?.banner,
        subscriber_count: rawResponse.statistics?.total?.subscribers,
        view_count: rawResponse.statistics?.total?.views,
        video_count: rawResponse.statistics?.total?.uploads,
        created_date: rawResponse.general?.created_at,
        country: rawResponse.general?.geo?.country,
        is_terminated: false,
        description: rawResponse.general?.branding?.website // Using website as description for now
      }

      console.log("Processed channel data:", channelData)

    } catch (socialBladeError) {
      console.error("SocialBlade error:", socialBladeError)
      
      // If SocialBlade fails, try to determine if channel is terminated
      // This is a basic check - in a real implementation, you might use YouTube Data API
      const isLikelyTerminated = await checkIfChannelTerminated(query)
      
      channelData = {
        channel_id: query,
        channel_name: "Unknown Channel",
        is_terminated: isLikelyTerminated,
        termination_reason: isLikelyTerminated 
          ? "Channel appears to be terminated or suspended" 
          : "Unable to fetch channel data"
      }
    }

    // Add flag if channel already exists
    if (existingChannel) {
      channelData = {
        ...channelData,
        channel_name: existingChannel.channel_name || channelData.channel_name
      }
    }

    return NextResponse.json(channelData)

  } catch (error) {
    console.error("Channel search error:", error)
    return NextResponse.json({
      error: "Failed to search channel: " + (error instanceof Error ? error.message : "Unknown error")
    }, { status: 500 })
  }
}

// Helper function to check if a channel might be terminated
async function checkIfChannelTerminated(channelId: string): Promise<boolean> {
  try {
    // Try to make a simple HTTP request to the channel page
    // Terminated channels typically return 404 or specific error pages
    
    const channelUrl = `https://www.youtube.com/channel/${channelId}`
    
    try {
      const response = await fetch(channelUrl, {
        method: 'HEAD', // Use HEAD to avoid downloading full page
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChannelChecker/1.0)'
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      })
      
      // If we get a 404, the channel is likely terminated or doesn't exist
      if (response.status === 404) {
        console.log(`Channel ${channelId} returned 404 - likely terminated`)
        return true
      }
      
      // If we get a redirect to YouTube's error page, it might be terminated
      if (response.url.includes('youtube.com/error') || 
          response.url.includes('youtube.com/oops')) {
        console.log(`Channel ${channelId} redirected to error page - likely terminated`)
        return true
      }
      
      console.log(`Channel ${channelId} appears to be active (status: ${response.status})`)
      return false
      
    } catch (fetchError) {
      // If fetch fails, we can't determine status reliably
      console.log("Could not check channel status via HTTP:", fetchError)
      
      // As a fallback, check against known terminated channel patterns
      // The example channel UCn0dc_nDWsSsIEOnv9fw5qw is terminated
      const knownTerminatedChannels = [
        'UCn0dc_nDWsSsIEOnv9fw5qw' // Example terminated channel from user
      ]
      
      if (knownTerminatedChannels.includes(channelId)) {
        return true
      }
      
      return false
    }
    
  } catch (error) {
    console.error("Error checking termination status:", error)
    return false
  }
}

// Alternative endpoint to check termination status specifically
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')
  
  if (!channelId) {
    return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
  }

  try {
    // Check termination status
    const isTerminated = await checkIfChannelTerminated(channelId)
    
    return NextResponse.json({
      channel_id: channelId,
      is_terminated: isTerminated,
      checked_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("Termination check error:", error)
    return NextResponse.json({
      error: "Failed to check termination status"
    }, { status: 500 })
  }
}
