import { type NextRequest, NextResponse } from "next/server"
import { ChannelService } from "@/lib/channel-service"

export async function GET() {
  try {
    const channels = await ChannelService.getAllChannels()
    return NextResponse.json(channels)
  } catch (error) {
    console.error("Failed to fetch channels:", error)
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const channelData = await request.json()
    await ChannelService.addChannel(channelData)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to add channel:", error)
    return NextResponse.json({ error: "Failed to add channel" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { channelId, ...updates } = await request.json()
    await ChannelService.updateChannel(channelId, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update channel:", error)
    return NextResponse.json({ error: "Failed to update channel" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
    }

    await ChannelService.deleteChannel(channelId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete channel:", error)
    return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 })
  }
}
