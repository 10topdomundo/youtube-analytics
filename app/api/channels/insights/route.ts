import { type NextRequest, NextResponse } from "next/server"
import { AnalyticsService } from "@/lib/analytics-service"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")
    const period = Number.parseInt(searchParams.get("period") || "30") as 3 | 7 | 30

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
    }

    const [analyticsData, metricsData, takeoffInfo] = await Promise.all([
      AnalyticsService.getChannelInsights(channelId, period),
      AnalyticsService.getPerformanceMetrics(channelId, period),
      AnalyticsService.calculateTimeToTakeoff(channelId),
    ])

    return NextResponse.json({
      analytics: analyticsData,
      metrics: metricsData,
      takeoff: takeoffInfo,
    })
  } catch (error) {
    console.error("Failed to load channel insights:", error)
    return NextResponse.json({ error: "Failed to load channel insights" }, { status: 500 })
  }
}
