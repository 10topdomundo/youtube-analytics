"use client"

import { useState, useEffect } from "react"
import { Plus, Save, Download, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartBuilder } from "./chart-builder"

interface ChannelTableData {
  id: string
  channel_id: string
  channel_name: string
  niche: string
  language: string
  views_last_30_days: number
  views_delta_30_days: string
  views_delta_7_days: string
  views_delta_3_days: string
  views_per_subscriber: number
  uploads_last_30d: number
  videos_until_takeoff: number
  days_until_takeoff: number
  days_creation_to_first_upload: number
  sub_niche: string
  channel_type: string
  channel_creation: string
  thumbnail_style: string
  video_style: string
  video_length: string
  status: string
  notes: string
  [key: string]: any // Allow dynamic columns
}

interface ChannelDataTableProps {
  isAdmin?: boolean
}

export function ChannelDataTable({ isAdmin = false }: ChannelDataTableProps) {
  const [data, setData] = useState<ChannelTableData[]>([])
  const [filteredData, setFilteredData] = useState<ChannelTableData[]>([])
  const [columns, setColumns] = useState<string[]>([
    "niche",
    "language", 
    "views_last_30_days",
    "views_delta_30_days",
    "views_delta_7_days",
    "views_delta_3_days",
    "views_per_subscriber",
    "uploads_last_30d",
    "videos_until_takeoff",
    "days_until_takeoff",
    "days_creation_to_first_upload",
    "sub_niche",
    "channel_type",
    "channel_creation",
    "thumbnail_style",
    "video_style", 
    "video_length",
    "status",
    "channel_name",
    "notes",
    "channel_id",
  ])
  const [newColumnName, setNewColumnName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
  const [showTakeoffFilter, setShowTakeoffFilter] = useState(false)
  const [takenOffChannels, setTakenOffChannels] = useState<string[]>([])

  useEffect(() => {
    loadChannelData()
    loadTakeoffChannels()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [data, showTakeoffFilter, takenOffChannels])

  const loadChannelData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/channels/table-data")
      if (!response.ok) {
        throw new Error("Failed to fetch channel data")
      }
      const channels = await response.json()
      setData(channels)
    } catch (error) {
      console.error("Failed to load channel data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTakeoffChannels = async () => {
    try {
      const response = await fetch("/api/channels/takeoff")
      if (response.ok) {
        const channels = await response.json()
        setTakenOffChannels(channels)
      }
    } catch (error) {
      console.error("Failed to load takeoff channels:", error)
    }
  }

  const applyFilters = () => {
    let filtered = [...data]

    if (showTakeoffFilter) {
      filtered = filtered.filter((channel) => takenOffChannels.includes(channel.channel_id))
    }

    setFilteredData(filtered)
  }

  const addColumn = () => {
    if (newColumnName && !columns.includes(newColumnName)) {
      setColumns([...columns, newColumnName])
      setData(data.map((row) => ({ ...row, [newColumnName]: "" })))
      setNewColumnName("")
    }
  }

  const updateCell = (rowIndex: number, columnName: string, value: any) => {
    const newData = [...data]
    newData[rowIndex] = { ...newData[rowIndex], [columnName]: value }
    setData(newData)
  }

  const saveData = async () => {
    try {
      const response = await fetch("/api/channels/table-data", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data, columns }),
      })

      if (!response.ok) {
        throw new Error("Failed to save data")
      }

      alert("Data saved successfully!")
    } catch (error) {
      console.error("Failed to save data:", error)
      alert("Failed to save data")
    }
  }

  const exportData = () => {
    const csv = [columns.join(","), ...data.map((row) => columns.map((col) => `"${row[col] || ""}"`).join(","))].join(
      "\n",
    )

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "channel-data.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatColumnName = (name: string) => {
    // Custom column name mappings to match the exact headers requested
    const customNames: Record<string, string> = {
      "niche": "Niche",
      "language": "Language", 
      "views_last_30_days": "Views last 30 days",
      "views_delta_30_days": "Views Δ% 30 days",
      "views_delta_7_days": "Views Δ% 7 days",
      "views_delta_3_days": "Views Δ% 3 days",
      "views_per_subscriber": "Views per subscriber",
      "uploads_last_30d": "Uploads (Last 30d)",
      "videos_until_takeoff": "Videos until takeoff",
      "days_until_takeoff": "Days Until Takeoff",
      "days_creation_to_first_upload": "Days Creation → First Upload",
      "sub_niche": "Sub-niche",
      "channel_type": "Channel type",
      "channel_creation": "Channel creation",
      "thumbnail_style": "Thumbnail style",
      "video_style": "Video style",
      "video_length": "Video length",
      "status": "Status",
      "channel_name": "Channel Name",
      "notes": "Notes",
      "channel_id": "Channel ID",
    }
    
    return customNames[name] || name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const renderCell = (row: ChannelTableData, column: string, rowIndex: number) => {
    const value = row[column]
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === column
    
    // Define read-only calculated fields
    const readOnlyFields = new Set([
      "views_last_30_days",
      "views_delta_30_days", 
      "views_delta_7_days",
      "views_delta_3_days",
      "views_per_subscriber",
      "uploads_last_30d",
      "videos_until_takeoff",
      "days_until_takeoff", 
      "days_creation_to_first_upload",
      "channel_creation",
      "channel_id",
      "total_subscribers",
      "total_views",
      "total_uploads"
    ])
    
    const isReadOnly = readOnlyFields.has(column)

    if (isEditing && isAdmin && !isReadOnly) {
      return (
        <Input
          value={value || ""}
          onChange={(e) => updateCell(rowIndex, column, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setEditingCell(null)
            }
          }}
          className="h-8 text-xs"
          autoFocus
        />
      )
    }

    // Format numeric values (views)
    if (column === "views_last_30_days" && typeof value === "number") {
      const formatViews = (num: number) => {
        if (num === 0) return ""
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${Math.round(num / 1000)}K`
        return num.toString()
      }
      
      return (
        <span className="p-1 font-mono text-xs">
          {formatViews(value)}
        </span>
      )
    }

    // Format percentage values
    if (column.includes("delta") && typeof value === "string") {
      // Don't show 0% values, just empty
      if (value === "0%" || value === "0.0%") {
        return <span className="p-1 font-mono text-xs text-muted-foreground">—</span>
      }
      
      const numValue = parseFloat(value.replace('%', ''))
      const colorClass = numValue > 0 ? "text-green-600" : numValue < 0 ? "text-red-600" : "text-gray-600"
      return (
        <span className={`p-1 font-mono text-xs ${colorClass}`}>
          {value}
        </span>
      )
    }

    // Format views per subscriber
    if (column === "views_per_subscriber" && typeof value === "number") {
      if (value === 0) {
        return <span className="p-1 font-mono text-xs text-muted-foreground">—</span>
      }
      return (
        <span className="p-1 font-mono text-xs">
          {value.toFixed(2)}
        </span>
      )
    }
    
    // Format other numeric fields that should be empty when zero
    if ((column === "uploads_last_30d" || column === "videos_until_takeoff" || 
         column === "days_until_takeoff" || column === "days_creation_to_first_upload") && 
        typeof value === "number") {
      if (value === 0) {
        return <span className="p-1 font-mono text-xs text-muted-foreground">—</span>
      }
      return (
        <span className="p-1 font-mono text-xs">
          {value.toLocaleString()}
        </span>
      )
    }

    if (column === "status") {
      return (
        <Badge
          variant={value === "Active" ? "default" : "secondary"}
          className={isAdmin && !isReadOnly ? "cursor-pointer" : ""}
          onClick={isAdmin && !isReadOnly ? () => setEditingCell({ row: rowIndex, col: column }) : undefined}
        >
          {value || "Unknown"}
        </Badge>
      )
    }

    return (
      <span
        className={`${isAdmin && !isReadOnly ? "cursor-pointer hover:bg-muted" : ""} p-1 rounded block min-h-[20px] text-xs ${isReadOnly ? "text-muted-foreground bg-muted/30" : ""}`}
        onClick={isAdmin && !isReadOnly ? () => setEditingCell({ row: rowIndex, col: column }) : undefined}
        title={isReadOnly ? "This field is calculated automatically" : undefined}
      >
        {value || ""}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Channel Data Table</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Channel Data Table</h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage and edit channel data in a spreadsheet-like interface" : "View channel data"}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2 mr-4">
              <Checkbox
                id="takeoff-filter"
                checked={showTakeoffFilter}
                onCheckedChange={(checked) => setShowTakeoffFilter(checked as boolean)}
              />
              <Label htmlFor="takeoff-filter" className="text-sm">
                Show only channels that took off
              </Label>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Column
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Column</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Column name"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                  />
                  <Button onClick={addColumn} className="w-full">
                    Add Column
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button onClick={saveData} size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>

            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}

        {!isAdmin && (
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2 mr-4">
              <Checkbox
                id="takeoff-filter"
                checked={showTakeoffFilter}
                onCheckedChange={(checked) => setShowTakeoffFilter(checked as boolean)}
              />
              <Label htmlFor="takeoff-filter" className="text-sm">
                Show only channels that took off
              </Label>
            </div>

            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Channel Data Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table">
                Data Table ({filteredData.length} channels)
                {showTakeoffFilter && (
                  <Badge variant="secondary" className="ml-2">
                    Filtered
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="charts">
                <BarChart3 className="w-4 h-4 mr-2" />
                Chart Builder
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="table" className="mt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column} className="min-w-[120px] text-xs">
                          {formatColumnName(column)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row, rowIndex) => (
                      <TableRow key={row.id || rowIndex}>
                        {columns.map((column) => (
                          <TableCell key={column} className="text-xs p-2">
                            {renderCell(row, column, rowIndex)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="charts" className="mt-4">
              <ChartBuilder data={filteredData} columns={columns} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
