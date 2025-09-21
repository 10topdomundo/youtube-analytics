import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
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
    const { data: channel, error } = await supabase
      .from("channels")
      .select("*")
      .eq("id", params.channelId)
      .single()

    if (error) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    return NextResponse.json(channel)
  } catch (error) {
    console.error("Get channel error:", error)
    return NextResponse.json({
      error: "Failed to fetch channel"
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
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
    const updates = await request.json()
    
    // Remove any fields that shouldn't be updated
    const allowedFields = [
      'channel_name',
      'channel_handle', 
      'channel_description',
      'channel_niche',
      'sub_niche',
      'channel_type',
      'channel_country',
      'channel_language',
      'thumbnail_style',
      'video_style',
      'video_length',
      'status',
      'notes',
      'custom_fields'
    ]
    
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updates[key]
        return obj
      }, {})

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Add updated_at timestamp
    filteredUpdates.updated_at = new Date().toISOString()

    const { data: channel, error } = await supabase
      .from("channels")
      .update(filteredUpdates)
      .eq("id", params.channelId)
      .select()
      .single()

    if (error) {
      console.error("Update channel error:", error)
      return NextResponse.json({ error: "Failed to update channel" }, { status: 500 })
    }

    return NextResponse.json(channel)
  } catch (error) {
    console.error("Update channel error:", error)
    return NextResponse.json({
      error: "Failed to update channel"
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin (optional - you might want to allow all users to delete)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    // Delete related data first (due to foreign key constraints)
    await supabase.from("channel_statistics").delete().eq("channel_id", params.channelId)
    await supabase.from("channel_ranks").delete().eq("channel_id", params.channelId)
    await supabase.from("channel_daily_stats").delete().eq("channel_id", params.channelId)
    await supabase.from("channel_social_links").delete().eq("channel_id", params.channelId)
    
    // Delete the channel
    const { error } = await supabase
      .from("channels")
      .delete()
      .eq("id", params.channelId)

    if (error) {
      console.error("Delete channel error:", error)
      return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete channel error:", error)
    return NextResponse.json({
      error: "Failed to delete channel"
    }, { status: 500 })
  }
}
