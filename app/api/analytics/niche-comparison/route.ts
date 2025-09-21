import { NextResponse } from "next/server"
import { AnalyticsService } from "@/lib/analytics-service"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    console.log("[v0] Niche comparison API route called")
    const { searchParams } = new URL(request.url)
    const period = Number.parseInt(searchParams.get("period") || "30")
    console.log("[v0] Period:", period)

    const data = await AnalyticsService.getNicheComparison(period as 3 | 7 | 30)
    console.log("[v0] Niche comparison data loaded successfully")
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Failed to load niche comparison:", error)
    return NextResponse.json({ error: "Failed to load niche comparison" }, { status: 500 })
  }
}
