"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface NicheData {
  niche: string
  totalViews: number
  totalSubscribers: number
  channelCount: number
  viewsChangePercent: number
  subscribersChangePercent: number
  averageViewsPerChannel: number
  averageSubscribersPerChannel: number
}

interface NicheComparisonChartProps {
  data: NicheData[]
  title?: string
  metric?: "views" | "subscribers" | "growth"
}

export function NicheComparisonChart({
  data,
  title = "Niche Performance Comparison",
  metric = "views",
}: NicheComparisonChartProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + "B"
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const getChartData = () => {
    switch (metric) {
      case "subscribers":
        return data.map((item) => ({
          niche: item.niche,
          value: item.totalSubscribers,
          average: item.averageSubscribersPerChannel,
        }))
      case "growth":
        return data.map((item) => ({
          niche: item.niche,
          viewsGrowth: item.viewsChangePercent,
          subsGrowth: item.subscribersChangePercent,
        }))
      default:
        return data.map((item) => ({
          niche: item.niche,
          value: item.totalViews,
          average: item.averageViewsPerChannel,
        }))
    }
  }

  const chartData = getChartData()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {metric === "growth" ? (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="niche"
                  className="text-muted-foreground text-xs"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  className="text-muted-foreground text-xs"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`,
                    name === "viewsGrowth" ? "Views Growth" : "Subscribers Growth",
                  ]}
                />
                <Legend />
                <Bar dataKey="viewsGrowth" fill="hsl(var(--chart-1))" name="Views Growth" radius={[4, 4, 0, 0]} />
                <Bar dataKey="subsGrowth" fill="hsl(var(--chart-2))" name="Subscribers Growth" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="niche"
                  className="text-muted-foreground text-xs"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
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
                    name === "value"
                      ? `Total ${metric === "subscribers" ? "Subscribers" : "Views"}`
                      : `Avg per Channel`,
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--chart-1))"
                  name={`Total ${metric === "subscribers" ? "Subscribers" : "Views"}`}
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="average" fill="hsl(var(--chart-2))" name="Average per Channel" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
