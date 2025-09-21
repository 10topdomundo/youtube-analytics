export interface Channel {
  id?: string // UUID from database
  channel_id: string
  channel_name: string
  channel_handle?: string
  channel_description?: string
  channel_thumbnail_url?: string
  channel_banner_url?: string
  channel_country?: string
  channel_language?: string
  channel_created_date?: string
  channel_keywords?: string[]

  // Manual entry fields (stored in database)
  channel_niche?: string
  sub_niche?: string
  channel_type?: string
  thumbnail_style?: string
  video_style?: string
  video_length?: string
  status?: string
  notes?: string
  custom_fields?: Record<string, any>

  // SocialBlade specific fields (from actual database schema)
  country_code?: string
  username?: string
  cusername?: string
  website?: string
  grade_color?: string
  grade?: string
  sb_verified?: boolean
  made_for_kids?: boolean
  social_links?: Record<string, any>
}

export interface ChannelStatistics {
  id: string | number
  channel_id: string
  total_uploads: number
  total_subscribers: number
  total_views: number
  total_likes?: number
  total_comments?: number
}

export interface ChannelRanks {
  id: string | number
  channel_id: string
  subscriber_rank?: number
  video_view_rank?: number
  country_rank?: number
  category_rank?: number
  global_rank?: number
}

export interface ChannelDailyStats {
  id: string | number
  channel_id: string
  stat_date: string // Date as string for consistency
  subscribers: number
  views: number
  estimated_earnings?: number
  video_uploads?: number
}

export interface ChannelSocialLinks {
  id: string | number
  channel_id: string
  platform: string
  url: string
}

export interface ChannelAnalytics {
  channel: Channel
  statistics: ChannelStatistics
  ranks: ChannelRanks
  dailyStats: ChannelDailyStats[]
  socialLinks: ChannelSocialLinks[]
  growth: {
    period: 3 | 7 | 30
    subscribersChange: number
    subscribersChangePercent: number
    viewsChange: number
    viewsChangePercent: number
    viewsPerSubscriber: number
  }
}

export interface SocialBladeResponse {
  status: {
    success: boolean
    status: number
    error?: string
  }
  info: {
    access: {
      seconds_to_expire: number
    }
    credits: {
      available: number
    }
  }
  data: {
    id: {
      id: string
      username?: string
      display_name: string
      cusername?: string
      handle?: string
    }
    general: {
      created_at: string
      channel_type: string
      geo: {
        country_code: string
        country: string
      }
      branding: {
        avatar: string
        banner?: string
        website: string
        social: {
          facebook: string
          twitter: string
          twitch: string
          instagram: string
          linkedin: string
          discord: string
          tiktok: string
        }
      }
    }
    statistics: {
      total: {
        uploads: number
        subscribers: number
        views: number
      }
      growth: {
        subs: {
          1: number
          3: number
          7: number
          14: number
          30: number
          60: number
          90: number
          180: number
          365: number
        }
        vidviews: {
          1: number
          3: number
          7: number
          14: number
          30: number
          60: number
          90: number
          180: number
          365: number
        }
      }
    }
    misc: {
      grade: {
        color: string
        grade: string
      }
      sb_verified: boolean
      made_for_kids: boolean
    }
    ranks: {
      sbrank: number
      subscribers: number
      views: number
      country: number
      channel_type: number
    }
    daily: Array<{
      date: string
      subs: number
      views: number
    }>
  }
}

export type TimePeriod = 3 | 7 | 30

export interface NicheAnalytics {
  niche: string
  totalChannels: number
  totalViews: number
  totalSubscribers: number
  averageViewsPerSubscriber: number
  growthRate: number
}

export interface ChannelPerformanceMetrics {
  channel_id: string
  display_name: string
  videosUntilTakeoff: number
  daysUntilTakeoff: number
  daysSinceCreation: number
  daysToFirstUpload: number
  currentGrowthRate: number
  peakGrowthPeriod: string
}

export interface ChannelCalculatedMetrics {
  views_last_30_days: number
  views_last_7_days: number
  views_last_3_days: number
  views_delta_30_days: number
  views_delta_7_days: number
  views_delta_3_days: number
  views_per_subscriber: number
  uploads_last_30_days: number
  videos_until_takeoff?: number
  days_until_takeoff?: number
  days_creation_to_first_upload?: number
}

export interface ChannelWithMetrics extends Channel {
  calculated: ChannelCalculatedMetrics
  statistics?: ChannelStatistics | null
}
