"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChannelDailyStats } from "@/lib/types"

interface DailyActivityChartProps {
  data: ChannelDailyStats[]
  title?: string
}

export function DailyActivityChart({ data, title = "Daily Activity" }: DailyActivityChartProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const sortedData = data.sort((a, b) => new Date(a.stat_date).getTime() - new Date(b.stat_date).getTime())

  const chartData = sortedData.map((stat, index) => {
    const prevStat = index > 0 ? sortedData[index - 1] : stat
    const dailyViewsChange = Math.max(0, stat.views - prevStat.views)
    const dailySubsChange = Math.max(0, stat.subscribers - prevStat.subscribers)

    return {
      date: formatDate(stat.stat_date),
      dailyViews: dailyViewsChange,
      dailySubsGained: dailySubsChange,
      // videoUploads: Not available from SocialBlade API
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dailyViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="dailySubsGained" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-muted-foreground text-xs" tick={{ fontSize: 12 }} />
              <YAxis className="text-muted-foreground text-xs" tick={{ fontSize: 12 }} tickFormatter={formatNumber} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--card-foreground))",
                }}
                formatter={(value: number, name: string) => [
                  formatNumber(value),
                  name === "dailyViews"
                    ? "Daily Views"
                    : name === "dailySubsGained"
                      ? "Daily Subs Gained"
                      : "Video Uploads",
                ]}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="dailyViews"
                stroke="hsl(var(--chart-1))"
                fillOpacity={1}
                fill="url(#dailyViews)"
                strokeWidth={2}
                name="Daily Views"
              />
              <Area
                type="monotone"
                dataKey="dailySubsGained"
                stroke="hsl(var(--chart-2))"
                fillOpacity={1}
                fill="url(#dailySubsGained)"
                strokeWidth={2}
                name="Daily Subs Gained"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
