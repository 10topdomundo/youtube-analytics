"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChannelDailyStats } from "@/lib/types"

interface GrowthChartProps {
  data: ChannelDailyStats[]
  title?: string
  showViews?: boolean
  showSubscribers?: boolean
}

export function GrowthChart({
  data,
  title = "Growth Trends",
  showViews = true,
  showSubscribers = true,
}: GrowthChartProps) {
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

  const chartData = data
    .sort((a, b) => new Date(a.stat_date).getTime() - new Date(b.stat_date).getTime())
    .map((stat) => ({
      date: formatDate(stat.stat_date),
      subscribers: stat.subscribers,
      views: stat.views,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                  name === "subscribers" ? "Subscribers" : "Total Views",
                ]}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Legend />
              {showSubscribers && (
                <Line
                  type="monotone"
                  dataKey="subscribers"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                  name="Subscribers"
                />
              )}
              {showViews && (
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                  name="Total Views"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
