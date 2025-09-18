import { NextResponse } from "next/server"
import { databaseService } from "@/lib/database-service"

export async function GET() {
  try {
    const takenOffChannels = await databaseService.getChannelsWithTakeoff()
    return NextResponse.json(takenOffChannels)
  } catch (error) {
    console.error("Failed to get takeoff channels:", error)
    return NextResponse.json({ error: "Failed to get takeoff channels" }, { status: 500 })
  }
}
