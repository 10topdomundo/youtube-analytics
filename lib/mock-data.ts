import type { Channel, ChannelStatistics, ChannelRanks, ChannelDailyStats, ChannelSocialLinks } from "./types"

// Mock channels data with diverse niches and realistic data
export const mockChannels: Channel[] = [
  {
    channel_id: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
    display_name: "Google Developers",
    handle: "@googledevelopers",
    created_at: new Date("2007-05-23"),
    channel_type: "Technology",
    country_code: "US",
    country: "United States",
    avatar_url: "/placeholder-0abki.png",
    website: "https://developers.google.com",
    grade_color: "green",
    grade: "A+",
    sb_verified: true,
    made_for_kids: false,
  },
  {
    channel_id: "UCWv7vMbMWH4-V0ZXdmDpPBA",
    display_name: "Programming with Mosh",
    handle: "@programmingwithmosh",
    created_at: new Date("2014-03-15"),
    channel_type: "Education",
    country_code: "CA",
    country: "Canada",
    avatar_url: "/placeholder-5amcr.png",
    website: "https://codewithmosh.com",
    grade_color: "green",
    grade: "A+",
    sb_verified: true,
    made_for_kids: false,
  },
  {
    channel_id: "UC8butISFwT-Wl7EV0hUK0BQ",
    display_name: "freeCodeCamp.org",
    handle: "@freecodecamp",
    created_at: new Date("2014-12-17"),
    channel_type: "Education",
    country_code: "US",
    country: "United States",
    avatar_url: "/placeholder-0btf9.png",
    website: "https://freecodecamp.org",
    grade_color: "green",
    grade: "A++",
    sb_verified: true,
    made_for_kids: false,
  },
  {
    channel_id: "UCsBjURrPoezykLs9EqgamOA",
    display_name: "Fireship",
    handle: "@fireship",
    created_at: new Date("2017-04-26"),
    channel_type: "Technology",
    country_code: "US",
    country: "United States",
    avatar_url: "/placeholder-sbusb.png",
    website: "https://fireship.io",
    grade_color: "green",
    grade: "A+",
    sb_verified: true,
    made_for_kids: false,
  },
  {
    channel_id: "UC29ju8bIPH5as8OGnQzwJyA",
    display_name: "Traversy Media",
    handle: "@traversymedia",
    created_at: new Date("2009-10-15"),
    channel_type: "Education",
    country_code: "US",
    country: "United States",
    avatar_url: "/placeholder-ohl3w.png",
    website: "https://traversymedia.com",
    grade_color: "green",
    grade: "A+",
    sb_verified: true,
    made_for_kids: false,
  },
  {
    channel_id: "UCFbNIlppjAuEX4znoulh0Cw",
    display_name: "Web Dev Simplified",
    handle: "@webdevsimplified",
    created_at: new Date("2018-12-05"),
    channel_type: "Education",
    country_code: "US",
    country: "United States",
    avatar_url: "/placeholder-g0fes.png",
    website: "https://blog.webdevsimplified.com",
    grade_color: "green",
    grade: "A",
    sb_verified: true,
    made_for_kids: false,
  },
  {
    channel_id: "UCWr0mx597DnSGLFk1WfvSkQ",
    display_name: "Crypto Casey",
    handle: "@cryptocasey",
    created_at: new Date("2017-08-12"),
    channel_type: "Finance",
    country_code: "US",
    country: "United States",
    avatar_url: "/placeholder-jz8s9.png",
    website: "https://cryptocasey.com",
    grade_color: "yellow",
    grade: "B+",
    sb_verified: true,
    made_for_kids: false,
  },
  {
    channel_id: "UC7cs8q-gJRlGwj4A8OmCmXg",
    display_name: "Alex Becker",
    handle: "@alexbecker",
    created_at: new Date("2016-02-28"),
    channel_type: "Business",
    country_code: "US",
    country: "United States",
    avatar_url: "/placeholder-pbwcr.png",
    website: "https://alexbecker.org",
    grade_color: "yellow",
    grade: "B",
    sb_verified: false,
    made_for_kids: false,
  },
  {
    channel_id: "UCJ24N4O0bP7LGLBDvye7oCA",
    display_name: "Matt DAvella",
    handle: "@mattdavella",
    created_at: new Date("2017-01-10"),
    channel_type: "Lifestyle",
    country_code: "US",
    country: "United States",
    avatar_url: "/placeholder.svg?height=80&width=80",
    website: "https://mattdavella.com",
    grade_color: "green",
    grade: "A",
    sb_verified: true,
    made_for_kids: false,
  },
  {
    channel_id: "UCmXmlB4-HJytD7wek0Uo97A",
    display_name: "JavaScript Mastery",
    handle: "@javascriptmastery",
    created_at: new Date("2020-03-22"),
    channel_type: "Education",
    country_code: "AU",
    country: "Australia",
    avatar_url: "/placeholder.svg?height=80&width=80",
    website: "https://jsmastery.pro",
    grade_color: "green",
    grade: "A",
    sb_verified: true,
    made_for_kids: false,
  },
  {
    channel_id: "UCeVMnSShP_Iviwkknt83cww",
    display_name: "CodeWithHarry",
    handle: "@codewithharry",
    created_at: new Date("2018-06-10"),
    channel_type: "Education",
    country_code: "IN",
    country: "India",
    avatar_url: "/placeholder.svg?height=80&width=80",
    website: "https://codewithharry.com",
    grade_color: "green",
    grade: "A+",
    sb_verified: true,
    made_for_kids: false,
  },
  {
    channel_id: "UC4JX40jDee_tINbkjycV4Sg",
    display_name: "Tech With Tim",
    handle: "@techwithtim",
    created_at: new Date("2017-09-12"),
    channel_type: "Technology",
    country_code: "CA",
    country: "Canada",
    avatar_url: "/placeholder.svg?height=80&width=80",
    website: "https://techwithtim.net",
    grade_color: "green",
    grade: "A",
    sb_verified: true,
    made_for_kids: false,
  },
  {
    channel_id: "UCmGSJVG3mCRXVOP4yZrU1Dw",
    display_name: "Ali Abdaal",
    handle: "@aliabdaal",
    created_at: new Date("2017-05-20"),
    channel_type: "Lifestyle",
    country_code: "GB",
    country: "United Kingdom",
    avatar_url: "/placeholder.svg?height=80&width=80",
    website: "https://aliabdaal.com",
    grade_color: "green",
    grade: "A+",
    sb_verified: true,
    made_for_kids: false,
  },
  {
    channel_id: "UCW5YeuERMmlnqo4oq8vwUpg",
    display_name: "The Net Ninja",
    handle: "@netninja",
    created_at: new Date("2015-01-08"),
    channel_type: "Education",
    country_code: "GB",
    country: "United Kingdom",
    avatar_url: "/placeholder.svg?height=80&width=80",
    website: "https://netninja.dev",
    grade_color: "green",
    grade: "A+",
    sb_verified: true,
    made_for_kids: false,
  },
  {
    channel_id: "UCrqAGUPPMOdo0jfQ6grikZw",
    display_name: "Coin Bureau",
    handle: "@coinbureau",
    created_at: new Date("2019-02-14"),
    channel_type: "Finance",
    country_code: "GB",
    country: "United Kingdom",
    avatar_url: "/placeholder.svg?height=80&width=80",
    website: "https://coinbureau.com",
    grade_color: "green",
    grade: "A",
    sb_verified: true,
    made_for_kids: false,
  },
]

// Mock channel statistics
export const mockChannelStatistics: ChannelStatistics[] = [
  { id: 1, channel_id: "UC_x5XG1OV2P6uZZ5FSM9Ttw", uploads: 1250, subscribers: 2100000, views: 315000000 },
  { id: 2, channel_id: "UCWv7vMbMWH4-V0ZXdmDpPBA", uploads: 180, subscribers: 1800000, views: 216000000 },
  { id: 3, channel_id: "UC8butISFwT-Wl7EV0hUK0BQ", uploads: 1800, subscribers: 6200000, views: 1240000000 },
  { id: 4, channel_id: "UCsBjURrPoezykLs9EqgamOA", uploads: 420, subscribers: 2800000, views: 504000000 },
  { id: 5, channel_id: "UC29ju8bIPH5as8OGnQzwJyA", uploads: 650, subscribers: 2000000, views: 280000000 },
  { id: 6, channel_id: "UCFbNIlppjAuEX4znoulh0Cw", uploads: 380, subscribers: 1200000, views: 192000000 },
  { id: 7, channel_id: "UCWr0mx597DnSGLFk1WfvSkQ", uploads: 220, subscribers: 450000, views: 40500000 },
  { id: 8, channel_id: "UC7cs8q-gJRlGwj4A8OmCmXg", uploads: 180, subscribers: 380000, views: 41800000 },
  { id: 9, channel_id: "UCJ24N4O0bP7LGLBDvye7oCA", uploads: 280, subscribers: 3200000, views: 544000000 },
  { id: 10, channel_id: "UCmXmlB4-HJytD7wek0Uo97A", uploads: 320, subscribers: 1500000, views: 195000000 },
  { id: 11, channel_id: "UCeVMnSShP_Iviwkknt83cww", uploads: 890, subscribers: 4200000, views: 630000000 },
  { id: 12, channel_id: "UC4JX40jDee_tINbkjycV4Sg", uploads: 450, subscribers: 1100000, views: 143000000 },
  { id: 13, channel_id: "UCmGSJVG3mCRXVOP4yZrU1Dw", uploads: 520, subscribers: 4800000, views: 816000000 },
  { id: 14, channel_id: "UCW5YeuERMmlnqo4oq8vUpg", uploads: 680, subscribers: 1600000, views: 224000000 },
  { id: 15, channel_id: "UCrqAGUPPMOdo0jfQ6grikZw", uploads: 380, subscribers: 2300000, views: 368000000 },
]

// Mock channel ranks
export const mockChannelRanks: ChannelRanks[] = [
  {
    id: 1,
    channel_id: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
    sbrank: 1250,
    subscribers: 5200,
    views: 8900,
    country_rank: 120,
    channel_type: "Technology",
  },
  {
    id: 2,
    channel_id: "UCWv7vMbMWH4-V0ZXdmDpPBA",
    sbrank: 1580,
    subscribers: 6800,
    views: 12000,
    country_rank: 85,
    channel_type: "Education",
  },
  {
    id: 3,
    channel_id: "UC8butISFwT-Wl7EV0hUK0BQ",
    sbrank: 420,
    subscribers: 1200,
    views: 2800,
    country_rank: 35,
    channel_type: "Education",
  },
  {
    id: 4,
    channel_id: "UCsBjURrPoezykLs9EqgamOA",
    sbrank: 980,
    subscribers: 3200,
    views: 6500,
    country_rank: 68,
    channel_type: "Technology",
  },
  {
    id: 5,
    channel_id: "UC29ju8bIPH5as8OGnQzwJyA",
    sbrank: 1120,
    subscribers: 4500,
    views: 9200,
    country_rank: 78,
    channel_type: "Education",
  },
  {
    id: 6,
    channel_id: "UCFbNIlppjAuEX4znoulh0Cw",
    sbrank: 2100,
    subscribers: 8900,
    views: 15600,
    country_rank: 145,
    channel_type: "Education",
  },
  {
    id: 7,
    channel_id: "UCWr0mx597DnSGLFk1WfvSkQ",
    sbrank: 8500,
    subscribers: 28000,
    views: 45000,
    country_rank: 580,
    channel_type: "Finance",
  },
  {
    id: 8,
    channel_id: "UC7cs8q-gJRlGwj4A8OmCmXg",
    sbrank: 9200,
    subscribers: 32000,
    views: 48000,
    country_rank: 620,
    channel_type: "Business",
  },
  {
    id: 9,
    channel_id: "UCJ24N4O0bP7LGLBDvye7oCA",
    sbrank: 750,
    subscribers: 2800,
    views: 5200,
    country_rank: 52,
    channel_type: "Lifestyle",
  },
  {
    id: 10,
    channel_id: "UCmXmlB4-HJytD7wek0Uo97A",
    sbrank: 1850,
    subscribers: 7200,
    views: 13500,
    country_rank: 25,
    channel_type: "Education",
  },
  {
    id: 11,
    channel_id: "UCeVMnSShP_Iviwkknt83cww",
    sbrank: 650,
    subscribers: 2100,
    views: 4200,
    country_rank: 15,
    channel_type: "Education",
  },
  {
    id: 12,
    channel_id: "UC4JX40jDee_tINbkjycV4Sg",
    sbrank: 2800,
    subscribers: 12000,
    views: 22000,
    country_rank: 95,
    channel_type: "Technology",
  },
  {
    id: 13,
    channel_id: "UCmGSJVG3mCRXVOP4yZrU1Dw",
    sbrank: 580,
    subscribers: 1800,
    views: 3500,
    country_rank: 42,
    channel_type: "Lifestyle",
  },
  {
    id: 14,
    channel_id: "UCW5YeuERMmlnqo4oq8vUpg",
    sbrank: 1650,
    subscribers: 6500,
    views: 12800,
    country_rank: 88,
    channel_type: "Education",
  },
  {
    id: 15,
    channel_id: "UCrqAGUPPMOdo0jfQ6grikZw",
    sbrank: 1200,
    subscribers: 4800,
    views: 8900,
    country_rank: 65,
    channel_type: "Finance",
  },
]

// Generate comprehensive daily stats for the last 30 days
export function generateMockDailyStats(): ChannelDailyStats[] {
  const stats: ChannelDailyStats[] = []
  const today = new Date()

  mockChannels.forEach((channel, channelIndex) => {
    const channelStats = mockChannelStatistics.find((s) => s.channel_id === channel.channel_id)
    if (!channelStats) return

    const baseSubscribers = channelStats.subscribers
    const baseViews = channelStats.views

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // Generate realistic growth patterns with seasonal variations
      const dayOfWeek = date.getDay()
      const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.2 : 1.0

      // Different growth rates by channel type
      const growthRates = {
        Technology: 0.0015,
        Education: 0.0012,
        Finance: 0.0008,
        Business: 0.0006,
        Lifestyle: 0.001,
      }

      const growthRate = growthRates[channel.channel_type as keyof typeof growthRates] || 0.001
      const dayVariation = (Math.random() * 0.004 - 0.002) * weekendMultiplier // -0.2% to +0.2% daily variation

      const subscriberGrowth = Math.floor(baseSubscribers * (growthRate + dayVariation))
      const viewGrowth = Math.floor(baseViews * (growthRate * 3 + dayVariation * 2))

      stats.push({
        id: channelIndex * 30 + i + 1,
        channel_id: channel.channel_id,
        stat_date: date,
        subscribers: Math.max(0, baseSubscribers - subscriberGrowth * i + Math.floor(Math.random() * 1000)),
        views: Math.max(0, baseViews - viewGrowth * i + Math.floor(Math.random() * 50000)),
      })
    }
  })

  return stats.sort((a, b) => new Date(b.stat_date).getTime() - new Date(a.stat_date).getTime())
}

// Generate social links for channels
export function generateMockSocialLinks(): ChannelSocialLinks[] {
  const links: ChannelSocialLinks[] = []
  const platforms = ["twitter", "instagram", "facebook", "linkedin", "tiktok", "discord"]

  mockChannels.forEach((channel, channelIndex) => {
    // Each channel has 2-4 social links
    const numLinks = Math.floor(Math.random() * 3) + 2
    const selectedPlatforms = platforms.sort(() => 0.5 - Math.random()).slice(0, numLinks)

    selectedPlatforms.forEach((platform, linkIndex) => {
      links.push({
        id: channelIndex * 10 + linkIndex + 1,
        channel_id: channel.channel_id,
        platform,
        url: `https://${platform}.com/${channel.handle?.replace("@", "") || channel.display_name?.toLowerCase().replace(/\s+/g, "")}`,
      })
    })
  })

  return links
}

// Mock SocialBlade API response generator
export function generateMockSocialBladeResponse(channelId: string) {
  const channel = mockChannels.find((c) => c.channel_id === channelId)
  if (!channel) {
    throw new Error("Channel not found")
  }

  const channelStats = mockChannelStatistics.find((s) => s.channel_id === channelId)
  const channelRanks = mockChannelRanks.find((r) => r.channel_id === channelId)
  const recentStats = mockDailyStats
    .filter((stat) => stat.channel_id === channelId)
    .slice(0, 30)
    .reverse()

  const currentStats = recentStats[recentStats.length - 1]
  const stats30DaysAgo = recentStats[0]

  if (!channelStats || !channelRanks || !currentStats || !stats30DaysAgo) {
    throw new Error("Insufficient data for channel")
  }

  return {
    status: {
      success: true,
      status: 200,
    },
    info: {
      access: {
        seconds_to_expire: 3600,
      },
      credits: {
        available: 1000,
      },
    },
    data: {
      id: {
        id: channel.channel_id,
        username: channel.handle?.replace("@", ""),
        display_name: channel.display_name,
        cusername: channel.display_name,
        handle: channel.handle,
      },
      general: {
        created_at: channel.created_at?.toISOString() || "2020-01-01T00:00:00Z",
        channel_type: "user",
        geo: {
          country_code: channel.country_code || "US",
          country: channel.country || "United States",
        },
        branding: {
          avatar: channel.avatar_url || "",
          banner: "",
          website: channel.website || "",
          social: {
            facebook: "",
            twitter: "",
            twitch: "",
            instagram: "",
            linkedin: "",
            discord: "",
            tiktok: "",
          },
        },
      },
      statistics: {
        total: {
          uploads: channelStats.uploads,
          subscribers: channelStats.subscribers,
          views: channelStats.views,
        },
        growth: {
          subs: {
            1: Math.floor(Math.random() * 1000) + 100,
            3: Math.floor(Math.random() * 3000) + 300,
            7: Math.floor(Math.random() * 7000) + 700,
            14: Math.floor(Math.random() * 14000) + 1400,
            30: currentStats.subscribers - stats30DaysAgo.subscribers,
            60: Math.floor(Math.random() * 60000) + 6000,
            90: Math.floor(Math.random() * 90000) + 9000,
            180: Math.floor(Math.random() * 180000) + 18000,
            365: Math.floor(Math.random() * 365000) + 36500,
          },
          vidviews: {
            1: Math.floor(Math.random() * 50000) + 5000,
            3: Math.floor(Math.random() * 150000) + 15000,
            7: Math.floor(Math.random() * 350000) + 35000,
            14: Math.floor(Math.random() * 700000) + 70000,
            30: currentStats.views - stats30DaysAgo.views,
            60: Math.floor(Math.random() * 3000000) + 300000,
            90: Math.floor(Math.random() * 4500000) + 450000,
            180: Math.floor(Math.random() * 9000000) + 900000,
            365: Math.floor(Math.random() * 18000000) + 1800000,
          },
        },
      },
      misc: {
        grade: {
          color: channel.grade_color || "green",
          grade: channel.grade || "A",
        },
        sb_verified: channel.sb_verified || false,
        made_for_kids: channel.made_for_kids || false,
      },
      ranks: {
        sbrank: channelRanks.sbrank,
        subscribers: channelRanks.subscribers,
        views: channelRanks.views,
        country: channelRanks.country_rank,
        channel_type: channelRanks.channel_type,
      },
      daily: recentStats.map((stat) => ({
        date:
          stat.stat_date instanceof Date
            ? stat.stat_date.toISOString().split("T")[0]
            : stat.stat_date.toString().split("T")[0],
        subs: stat.subscribers,
        views: stat.views,
      })),
    },
  }
}

export const mockDailyStats = generateMockDailyStats()
export const mockSocialLinks = generateMockSocialLinks()

export function calculateChannelGrowth(channelId: string, period: 3 | 7 | 30 = 30) {
  const channelStats = mockDailyStats
    .filter((stat) => stat.channel_id === channelId)
    .sort((a, b) => new Date(a.stat_date).getTime() - new Date(b.stat_date).getTime())

  if (channelStats.length < period) return null

  const currentStats = channelStats[channelStats.length - 1]
  const previousStats = channelStats[channelStats.length - period - 1]

  const subscribersChange = currentStats.subscribers - previousStats.subscribers
  const viewsChange = currentStats.views - previousStats.views

  return {
    subscribersChange,
    subscribersChangePercent: (subscribersChange / previousStats.subscribers) * 100,
    viewsChange,
    viewsChangePercent: (viewsChange / previousStats.views) * 100,
    viewsPerSubscriber: currentStats.views / currentStats.subscribers,
  }
}

export function getNicheAnalytics() {
  const nicheData = new Map<
    string,
    {
      channels: number
      totalViews: number
      totalSubscribers: number
      totalUploads: number
    }
  >()

  mockChannels.forEach((channel) => {
    const niche = channel.channel_type || "Other"
    const stats = mockChannelStatistics.find((s) => s.channel_id === channel.channel_id)

    if (!stats) return

    const existing = nicheData.get(niche) || { channels: 0, totalViews: 0, totalSubscribers: 0, totalUploads: 0 }
    nicheData.set(niche, {
      channels: existing.channels + 1,
      totalViews: existing.totalViews + stats.views,
      totalSubscribers: existing.totalSubscribers + stats.subscribers,
      totalUploads: existing.totalUploads + stats.uploads,
    })
  })

  return Array.from(nicheData.entries()).map(([niche, data]) => ({
    niche,
    totalChannels: data.channels,
    totalViews: data.totalViews,
    totalSubscribers: data.totalSubscribers,
    averageViewsPerSubscriber: data.totalViews / data.totalSubscribers,
    averageUploads: data.totalUploads / data.channels,
  }))
}

export function getChannelPerformanceMetrics() {
  return mockChannels
    .map((channel) => {
      const stats = mockChannelStatistics.find((s) => s.channel_id === channel.channel_id)
      const dailyStats = mockDailyStats.filter((s) => s.channel_id === channel.channel_id)

      if (!stats) return null

      // Calculate days since creation
      const creationDate = channel.created_at ? new Date(channel.created_at) : new Date()
      const daysSinceCreation = Math.floor((Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24))

      // Estimate takeoff metrics (simplified calculation)
      const videosUntilTakeoff = Math.floor(stats.uploads * 0.1) + Math.floor(Math.random() * 20) + 5
      const daysUntilTakeoff = Math.floor(daysSinceCreation * 0.3) + Math.floor(Math.random() * 180) + 30

      // Calculate current growth rate
      const recentGrowth = calculateChannelGrowth(channel.channel_id, 7)
      const currentGrowthRate = recentGrowth ? recentGrowth.subscribersChangePercent : 0

      return {
        channel_id: channel.channel_id,
        display_name: channel.display_name || "Unknown",
        videosUntilTakeoff,
        daysUntilTakeoff,
        daysSinceCreation,
        daysToFirstUpload: 5, // Simplified
        currentGrowthRate,
        peakGrowthPeriod: currentGrowthRate > 2 ? "Current" : "Past 30 days",
      }
    })
    .filter(Boolean)
}
