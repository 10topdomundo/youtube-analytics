import type { SocialBladeResponse } from "./types"

export class SocialBladeClient {
  private clientId: string
  private clientSecret: string
  private baseUrl = "https://api.socialblade.com/v2"

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  // Real implementation - would make actual API calls
  async getYouTubeUser(channelId: string): Promise<SocialBladeResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      // In production, this would be:
      const response = await fetch(`${this.baseUrl}/youtube/user/${channelId}`, {
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`SocialBlade API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("SocialBlade API error:", error)
      throw new Error("Failed to fetch data from SocialBlade")
    }
  }

  // Real implementation for getting access token
  private async getAccessToken(): Promise<string> {
    // In production, this would authenticate with SocialBlade
    const response = await fetch(`${this.baseUrl}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "client_credentials",
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to get access token")
    }

    const data = await response.json()
    return data.access_token
  }

  // Get multiple channels data
  async getMultipleChannels(channelIds: string[]): Promise<SocialBladeResponse[]> {
    const promises = channelIds.map((id) => this.getYouTubeUser(id))
    return Promise.all(promises)
  }

  // Check API status and credits
  async getApiStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to get API status")
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to get API status:", error)
      return {
        status: "unknown",
        credits_remaining: 0,
        rate_limit: {
          requests_per_hour: 0,
          requests_remaining: 0,
        },
      }
    }
  }
}

// Singleton instance
let socialBladeClient: SocialBladeClient | null = null

export function getSocialBladeClient(): SocialBladeClient {
  if (!socialBladeClient) {
    // In production, these would come from environment variables
    const clientId = process.env.SOCIALBLADE_CLIENT_ID || ""
    const clientSecret = process.env.SOCIALBLADE_CLIENT_SECRET || ""

    if (!clientId || !clientSecret) {
      throw new Error("SocialBlade credentials not configured")
    }

    socialBladeClient = new SocialBladeClient(clientId, clientSecret)
  }
  return socialBladeClient
}
