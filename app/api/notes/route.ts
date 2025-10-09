import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

// GET - Fetch notes for a specific channel
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
    }

    const { data: notes, error } = await supabase
      .from("notes")
      .select("*")
      .eq("channel_id", channelId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching notes:", error)
      return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
    }

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Notes API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new note
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
    const { channelId, noteContent } = await request.json()

    if (!channelId || !noteContent) {
      return NextResponse.json({ error: "Channel ID and note content are required" }, { status: 400 })
    }

    const { data: note, error } = await supabase
      .from("notes")
      .insert([
        {
          channel_id: channelId,
          note_content: noteContent,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating note:", error)
      return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error("Notes API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update an existing note
export async function PUT(request: NextRequest) {
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
    const { id, noteContent } = await request.json()

    if (!id || !noteContent) {
      return NextResponse.json({ error: "Note ID and content are required" }, { status: 400 })
    }

    const { data: note, error } = await supabase
      .from("notes")
      .update({
        note_content: noteContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating note:", error)
      return NextResponse.json({ error: "Failed to update note" }, { status: 500 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error("Notes API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a note
export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting note:", error)
      return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notes API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}








