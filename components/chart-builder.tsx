"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BarChart3, PieChart, TrendingUp, Download, Save, X } from "lucide-react"
import { 
  PieChart as RechartsPieChart,
  Pie,
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts"

interface ChartBuilderProps {
  data: any[]
  columns: string[]
}

interface ChartConfig {
  id: string
  title: string
  type: 'pie' | 'bar' | 'line' | 'area'
  xColumn?: string
  yColumn: string
  groupByColumn?: string
  aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min'
  color?: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']

// Column metadata to help determine appropriate chart types
const getColumnMetadata = (data: any[], columnName: string) => {
  if (!data.length) return { type: 'unknown', uniqueValues: 0, isNumeric: false, isDate: false }
  
  const values = data.map(row => row[columnName]).filter(val => val != null)
  const uniqueValues = new Set(values).size
  const sampleValue = values[0]
  
  // Check if numeric
  const isNumeric = values.every(val => !isNaN(Number(val)) && isFinite(Number(val)))
  
  // Check if date
  const isDate = values.every(val => !isNaN(Date.parse(val)))
  
  // Determine type
  let type = 'categorical'
  if (isNumeric) type = 'numeric'
  else if (isDate) type = 'date'
  else if (uniqueValues < 10) type = 'categorical'
  else type = 'text'
  
  return {
    type,
    uniqueValues,
    isNumeric,
    isDate,
    sampleValues: values.slice(0, 3)
  }
}

// Get recommended chart types based on column selection
const getRecommendedChartTypes = (xColumn: string | undefined, yColumn: string, data: any[]) => {
  const yMeta = getColumnMetadata(data, yColumn)
  const xMeta = xColumn ? getColumnMetadata(data, xColumn) : null
  
  const recommendations = []
  
  // If Y is numeric
  if (yMeta.isNumeric) {
    // If no X column, suggest aggregation charts
    if (!xColumn) {
      recommendations.push({ type: 'bar', reason: 'Good for showing totals' })
    }
    // If X is categorical with few values
    else if (xMeta?.type === 'categorical' && xMeta.uniqueValues < 20) {
      recommendations.push({ type: 'pie', reason: 'Good for showing distribution' })
      recommendations.push({ type: 'bar', reason: 'Good for comparing categories' })
    }
    // If X is date/time
    else if (xMeta?.isDate) {
      recommendations.push({ type: 'line', reason: 'Good for trends over time' })
      recommendations.push({ type: 'area', reason: 'Good for showing cumulative trends' })
    }
    // If X is numeric
    else if (xMeta?.isNumeric) {
      recommendations.push({ type: 'line', reason: 'Good for showing relationships' })
      recommendations.push({ type: 'bar', reason: 'Good for comparing values' })
    }
  }
  
  return recommendations
}

export function ChartBuilder({ data, columns }: ChartBuilderProps) {
  const [charts, setCharts] = useState<ChartConfig[]>([])
  const [savedCharts, setSavedCharts] = useState<any[]>([])
  const [currentChart, setCurrentChart] = useState<Partial<ChartConfig>>({
    type: 'bar',
    aggregation: 'sum'
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load saved charts on component mount
  useEffect(() => {
    loadSavedCharts()
  }, [])

  const loadSavedCharts = async () => {
    try {
      const response = await fetch('/api/charts')
      if (response.ok) {
        const charts = await response.json()
        setSavedCharts(charts)
      }
    } catch (error) {
      console.error('Failed to load saved charts:', error)
    }
  }
  
  // Get column metadata for all columns
  const columnMetadata = useMemo(() => {
    const metadata: Record<string, any> = {}
    columns.forEach(col => {
      metadata[col] = getColumnMetadata(data, col)
    })
    return metadata
  }, [data, columns])
  
  // Get numeric columns for Y-axis
  const numericColumns = useMemo(() => {
    return columns.filter(col => columnMetadata[col]?.isNumeric)
  }, [columns, columnMetadata])
  
  // Get categorical columns for X-axis and grouping
  const categoricalColumns = useMemo(() => {
    return columns.filter(col => 
      columnMetadata[col]?.type === 'categorical' || 
      columnMetadata[col]?.uniqueValues < 50
    )
  }, [columns, columnMetadata])
  
  // Get date columns
  const dateColumns = useMemo(() => {
    return columns.filter(col => columnMetadata[col]?.isDate)
  }, [columns, columnMetadata])
  
  // Process data for chart based on configuration
  const processChartData = (config: ChartConfig) => {
    if (!config.yColumn) return []
    
    let processedData = [...data]
    
    // If no X column, aggregate all data
    if (!config.xColumn) {
      const value = processedData.reduce((acc, row) => {
        const val = Number(row[config.yColumn]) || 0
        switch (config.aggregation) {
          case 'sum': return acc + val
          case 'avg': return acc + val / processedData.length
          case 'max': return Math.max(acc, val)
          case 'min': return Math.min(acc, val)
          case 'count': return processedData.length
          default: return acc + val
        }
      }, config.aggregation === 'min' ? Infinity : 0)
      
      return [{ name: config.yColumn, value }]
    }
    
    // Group by X column
    const grouped = processedData.reduce((acc, row) => {
      const key = row[config.xColumn!]
      if (!acc[key]) acc[key] = []
      acc[key].push(row)
      return acc
    }, {} as Record<string, any[]>)
    
    // Aggregate within groups
    return Object.entries(grouped).map(([key, group]) => {
      const typedGroup = group as any[]
      let value = 0
      switch (config.aggregation) {
        case 'sum':
          value = typedGroup.reduce((sum: number, row: any) => sum + (Number(row[config.yColumn]) || 0), 0)
          break
        case 'avg':
          value = typedGroup.reduce((sum: number, row: any) => sum + (Number(row[config.yColumn]) || 0), 0) / typedGroup.length
          break
        case 'max':
          value = Math.max(...typedGroup.map((row: any) => Number(row[config.yColumn]) || 0))
          break
        case 'min':
          value = Math.min(...typedGroup.map((row: any) => Number(row[config.yColumn]) || 0))
          break
        case 'count':
          value = typedGroup.length
          break
        default:
          value = typedGroup.reduce((sum: number, row: any) => sum + (Number(row[config.yColumn]) || 0), 0)
      }
      
      return {
        name: key,
        value: Math.round(value * 100) / 100,
        [config.yColumn]: Math.round(value * 100) / 100
      }
    }).sort((a, b) => b.value - a.value).slice(0, 20) // Limit to top 20 for readability
  }
  
  // Render chart based on type
  const renderChart = (config: ChartConfig) => {
    const chartData = processChartData(config)
    
    if (!chartData.length) {
      return <div className="flex items-center justify-center h-64 text-muted-foreground">No data available</div>
    }
    
    switch (config.type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Tooltip />
              <Legend />
              <Pie 
                data={chartData} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={80}
                label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </RechartsPieChart>
          </ResponsiveContainer>
        )
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        )
      
      default:
        return <div>Unsupported chart type</div>
    }
  }
  
  const handleCreateChart = () => {
    if (!currentChart.yColumn) return
    
    const newChart: ChartConfig = {
      id: Date.now().toString(),
      title: currentChart.title || `${currentChart.yColumn} ${currentChart.type} chart`,
      type: currentChart.type!,
      yColumn: currentChart.yColumn,
      xColumn: currentChart.xColumn,
      aggregation: currentChart.aggregation || 'sum'
    }
    
    setCharts([...charts, newChart])
    setCurrentChart({ type: 'bar', aggregation: 'sum' })
    setIsDialogOpen(false)
  }
  
  const handleSaveChart = async (chart: ChartConfig) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/charts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chart),
      })

      if (response.ok) {
        await loadSavedCharts()
        // Show success message or toast here
      }
    } catch (error) {
      console.error('Failed to save chart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChart = (chartId: string) => {
    setCharts(charts.filter(chart => chart.id !== chartId))
  }

  const handleDeleteSavedChart = async (chartId: string) => {
    try {
      const response = await fetch(`/api/charts?id=${chartId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadSavedCharts()
      }
    } catch (error) {
      console.error('Failed to delete saved chart:', error)
    }
  }

  const handleLoadSavedChart = (savedChart: any) => {
    const chartConfig: ChartConfig = {
      id: Date.now().toString(),
      ...savedChart.config,
    }
    setCharts([...charts, chartConfig])
  }
  
  const recommendations = currentChart.yColumn ? 
    getRecommendedChartTypes(currentChart.xColumn, currentChart.yColumn, data) : []
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Chart Builder</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <BarChart3 className="w-4 h-4 mr-2" />
              Create Chart
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Chart</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Chart Title</Label>
                <Input
                  id="title"
                  placeholder="Enter chart title"
                  value={currentChart.title || ''}
                  onChange={(e) => setCurrentChart({ ...currentChart, title: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Data Column (Y-axis)</Label>
                <Select
                  value={currentChart.yColumn || ''}
                  onValueChange={(value) => setCurrentChart({ ...currentChart, yColumn: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data column" />
                  </SelectTrigger>
                  <SelectContent>
                    {numericColumns.map(col => (
                      <SelectItem key={col} value={col}>
                        {col} <Badge variant="outline" className="ml-2">numeric</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Category Column (X-axis) - Optional</Label>
                <Select
                  value={currentChart.xColumn || '__none__'}
                  onValueChange={(value) => setCurrentChart({ ...currentChart, xColumn: value === "__none__" ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None (aggregate all data)</SelectItem>
                    {[...categoricalColumns, ...dateColumns].map(col => (
                      <SelectItem key={col} value={col}>
                        {col} 
                        <Badge variant="outline" className="ml-2">
                          {columnMetadata[col]?.isDate ? 'date' : 'categorical'}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Aggregation Method</Label>
                <Select
                  value={currentChart.aggregation || 'sum'}
                  onValueChange={(value) => setCurrentChart({ ...currentChart, aggregation: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="avg">Average</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="max">Maximum</SelectItem>
                    <SelectItem value="min">Minimum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {recommendations.length > 0 && (
                <div className="grid gap-2">
                  <Label>Recommended Chart Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.map((rec, index) => (
                      <Button
                        key={index}
                        variant={currentChart.type === rec.type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentChart({ ...currentChart, type: rec.type as any })}
                      >
                        {rec.type === 'pie' && <PieChart className="w-4 h-4 mr-1" />}
                        {rec.type === 'bar' && <BarChart3 className="w-4 h-4 mr-1" />}
                        {(rec.type === 'line' || rec.type === 'area') && <TrendingUp className="w-4 h-4 mr-1" />}
                        {rec.type}
                        <span className="ml-1 text-xs text-muted-foreground">({rec.reason})</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid gap-2">
                <Label>Chart Type</Label>
                <Tabs
                  value={currentChart.type || 'bar'}
                  onValueChange={(value) => setCurrentChart({ ...currentChart, type: value as any })}
                >
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="bar">Bar</TabsTrigger>
                    <TabsTrigger value="pie">Pie</TabsTrigger>
                    <TabsTrigger value="line">Line</TabsTrigger>
                    <TabsTrigger value="area">Area</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {currentChart.yColumn && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Preview</h4>
                  <div className="h-64">
                    {renderChart({
                      id: 'preview',
                      title: 'Preview',
                      type: currentChart.type!,
                      yColumn: currentChart.yColumn,
                      xColumn: currentChart.xColumn,
                      aggregation: currentChart.aggregation || 'sum'
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateChart} disabled={!currentChart.yColumn}>
                Create Chart
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {charts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No charts created yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first chart by selecting columns from your data
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Create Chart
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {savedCharts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Saved Charts</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {savedCharts.map((savedChart) => (
                  <Card key={savedChart.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{savedChart.title}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLoadSavedChart(savedChart)}
                            title="Load Chart"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSavedChart(savedChart.id)}
                            title="Delete Saved Chart"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xs text-muted-foreground">
                        {savedChart.chart_type} • {savedChart.config.yColumn}
                        {savedChart.config.xColumn && ` by ${savedChart.config.xColumn}`}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid gap-6 md:grid-cols-2">
            {charts.map((chart) => (
            <Card key={chart.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">{chart.title}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" title="Export Chart">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSaveChart(chart)}
                    disabled={isLoading}
                    title="Save Chart"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteChart(chart.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-sm text-muted-foreground">
                  {chart.aggregation} of {chart.yColumn}
                  {chart.xColumn && ` by ${chart.xColumn}`}
                </div>
                {renderChart(chart)}
              </CardContent>
            </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
