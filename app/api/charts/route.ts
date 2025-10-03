import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get saved charts for the user
    const { data: charts, error } = await supabase
      .from("saved_charts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(charts || [])
  } catch (error) {
    console.error("Charts API error:", error)
    return NextResponse.json({ error: "Failed to load charts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const chartConfig = await request.json()

    // Save chart configuration
    const { data: savedChart, error } = await supabase
      .from("saved_charts")
      .insert({
        user_id: user.id,
        title: chartConfig.title,
        chart_type: chartConfig.type,
        config: chartConfig,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(savedChart)
  } catch (error) {
    console.error("Chart save error:", error)
    return NextResponse.json({ error: "Failed to save chart" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const chartId = searchParams.get("id")

    if (!chartId) {
      return NextResponse.json({ error: "Chart ID required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("saved_charts")
      .delete()
      .eq("id", chartId)
      .eq("user_id", user.id) // Ensure user can only delete their own charts

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Chart delete error:", error)
    return NextResponse.json({ error: "Failed to delete chart" }, { status: 500 })
  }
}








