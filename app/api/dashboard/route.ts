import { type NextRequest, NextResponse } from "next/server"
import { AnalyticsService } from "@/lib/analytics-service"

export const dynamic = 'force-dynamic'
import type { TimePeriod } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = Number.parseInt(searchParams.get("period") || "30") as TimePeriod

    const data = await AnalyticsService.getDashboardOverview(period)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 })
  }
}
