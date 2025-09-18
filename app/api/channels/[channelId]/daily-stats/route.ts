import { NextResponse } from "next/server"
import { databaseService } from "@/lib/database-service"

export async function GET(request: Request, { params }: { params: { channelId: string } }) {
  try {
    console.log("[v0] Daily stats API route called for channel:", params.channelId)
    const { searchParams } = new URL(request.url)
    const period = Number.parseInt(searchParams.get("period") || "30")
    console.log("[v0] Period:", period)

    const stats = await databaseService.getChannelDailyStats(params.channelId, period)
    console.log("[v0] Daily stats loaded successfully")
    return NextResponse.json(stats)
  } catch (error) {
    console.error("[v0] Failed to load channel daily stats:", error)
    return NextResponse.json({ error: "Failed to load channel daily stats" }, { status: 500 })
  }
}
