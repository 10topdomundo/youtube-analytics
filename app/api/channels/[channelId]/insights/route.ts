import { type NextRequest, NextResponse } from "next/server"
import { AnalyticsService } from "@/lib/analytics-service"

export async function GET(request: NextRequest, { params }: { params: { channelId: string } }) {
  try {
    console.log("[v0] Channel insights API route called for channel:", params.channelId)

    const { searchParams } = new URL(request.url)
    const period = Number.parseInt(searchParams.get("period") || "30") as 3 | 7 | 30

    console.log("[v0] Period:", period)

    const [analyticsData, metricsData, takeoffInfo] = await Promise.all([
      AnalyticsService.getChannelInsights(params.channelId, period),
      AnalyticsService.getPerformanceMetrics(params.channelId, period),
      AnalyticsService.calculateTimeToTakeoff(params.channelId),
    ])

    console.log("[v0] Channel insights loaded successfully")

    return NextResponse.json({
      analytics: analyticsData,
      metrics: metricsData,
      takeoff: takeoffInfo,
    })
  } catch (error) {
    console.error("[v0] Failed to load channel insights:", error)
    return NextResponse.json({ error: "Failed to load channel insights" }, { status: 500 })
  }
}
