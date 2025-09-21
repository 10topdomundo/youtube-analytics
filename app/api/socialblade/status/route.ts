import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check if SocialBlade credentials are configured
    const clientId = process.env.SOCIALBLADE_CLIENT_ID
    const clientSecret = process.env.SOCIALBLADE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        status: "not_configured",
        error: "SocialBlade credentials not configured"
      })
    }

    // If credentials are configured, assume they're valid
    // We don't make test API calls to avoid wasting credits
    return NextResponse.json({
      status: "configured",
      message: "SocialBlade credentials are configured and ready to use."
    })

  } catch (error) {
    console.error("SocialBlade status error:", error)
    return NextResponse.json({
      status: "error",
      error: "Failed to check SocialBlade status"
    }, { status: 500 })
  }
}
