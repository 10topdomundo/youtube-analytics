"use client"

import { useState, useEffect } from "react"
import { Plus, Save, Download, BarChart3, ExternalLink, Calendar, FileSpreadsheet, CheckSquare, Square } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  // videos_uploaded_last_30_days: number // Not available from SocialBlade API
  // Removed assumption-based fields that were incorrectly calculated:
  // uploads_last_30d: based on incorrect assumptions about upload frequency
  // videos_until_takeoff: based on assumed "takeoff point" 
  // days_until_takeoff: based on assumed "takeoff point"
  // days_creation_to_first_upload: hardcoded to 30 days
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
  const [timePeriod, setTimePeriod] = useState<string>("30")
  const [columns, setColumns] = useState<string[]>([
    "niche",
    "language", 
    `views_last_30_days`, // Will be updated by useEffect when timePeriod changes
    // "videos_uploaded_last_30_days", // Not available from SocialBlade API
    "views_delta_30_days",
    "views_delta_7_days",
    "views_delta_3_days",
    "views_per_subscriber",
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
  // Removed takeoff filter functionality - was based on incorrect assumptions
  const [selectedNiche, setSelectedNiche] = useState<string>("all")
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null)
  const [showColumnSelection, setShowColumnSelection] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set(columns))
  const [sortByTotalViews, setSortByTotalViews] = useState<boolean>(false)

  useEffect(() => {
    loadChannelData()
  }, [timePeriod])

  useEffect(() => {
    // Update columns when time period changes
    setColumns([
      "niche",
      "language", 
      `views_last_${timePeriod}_days`, // Dynamic column based on time period
      // "videos_uploaded_last_30_days", // Not available from SocialBlade API
      "views_delta_30_days",
      "views_delta_7_days",
      "views_delta_3_days",
      "views_per_subscriber",
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
    // Update selected columns to include the new dynamic column
    setSelectedColumns(prev => {
      const newSet = new Set(prev)
      // Remove old views_last_X_days columns
      Array.from(prev).forEach(col => {
        if (col.startsWith('views_last_') && col.endsWith('_days')) {
          newSet.delete(col)
        }
      })
      // Add new dynamic column
      newSet.add(`views_last_${timePeriod}_days`)
      return newSet
    })
  }, [timePeriod])

  useEffect(() => {
    applyFilters()
  }, [data, selectedNiche, sortConfig, sortByTotalViews])

  const loadChannelData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/channels/table-data?period=${timePeriod}`)
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

  // Removed loadTakeoffChannels function - was based on incorrect assumptions

  const applyFilters = () => {
    let filtered = [...data]
    
    // Apply niche filter
    if (selectedNiche !== "all") {
      filtered = filtered.filter(channel => channel.niche === selectedNiche)
    }
    
    // Apply total views sorting if enabled
    if (sortByTotalViews) {
      filtered.sort((a, b) => {
        const aViews = a.total_views || 0
        const bViews = b.total_views || 0
        return bViews - aViews // Descending order (highest views first)
      })
    }
    // Apply manual sorting (takes precedence over total views sorting)
    else if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        // Handle different data types
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
        }
        
        // Handle string comparison
        const aStr = String(aValue || '').toLowerCase()
        const bStr = String(bValue || '').toLowerCase()
        
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr)
        } else {
          return bStr.localeCompare(aStr)
        }
      })
    }
    
    setFilteredData(filtered)
  }

  const handleSort = (columnKey: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    
    if (sortConfig && sortConfig.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    
    setSortConfig({ key: columnKey, direction })
    // Clear total views sorting when manual sorting is applied
    setSortByTotalViews(false)
  }

  const handleTotalViewsSort = (checked: boolean) => {
    setSortByTotalViews(checked)
    // Clear manual sorting when total views sorting is enabled
    if (checked) {
      setSortConfig(null)
    }
  }

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null
    }
    
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  const getUniqueNiches = () => {
    const niches = data.map(channel => channel.niche).filter(Boolean)
    return [...new Set(niches)].sort()
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

  const exportSelectedColumnsToXLS = () => {
    const selectedCols = Array.from(selectedColumns)
    
    // Create XLS content (tab-separated values with XLS mime type)
    const header = selectedCols.join("\t")
    const rows = data.map((row) => 
      selectedCols.map((col) => {
        const value = row[col] || ""
        // Clean value for XLS format
        return typeof value === 'string' ? value.replace(/[\t\n\r]/g, ' ') : value
      }).join("\t")
    ).join("\n")
    
    const xlsContent = header + "\n" + rows
    
    const blob = new Blob([xlsContent], { 
      type: "application/vnd.ms-excel" 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `channel-data-${selectedCols.length}-columns.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleColumnSelection = (column: string) => {
    const newSelected = new Set(selectedColumns)
    if (newSelected.has(column)) {
      newSelected.delete(column)
    } else {
      newSelected.add(column)
    }
    setSelectedColumns(newSelected)
  }

  const formatColumnName = (name: string) => {
    // Handle dynamic views_last_X_days column
    if (name.startsWith('views_last_') && name.endsWith('_days')) {
      const period = name.match(/views_last_(\d+)_days/)?.[1]
      return `Views last ${period} days`
    }
    
    // Custom column name mappings to match the exact headers requested
    const customNames: Record<string, string> = {
      "niche": "Niche",
      "language": "Language", 
      "views_last_30_days": "Views last 30 days", // Fallback for old static name
      // "videos_uploaded_last_30_days": "Videos uploaded last 30 days", // Not available from SocialBlade
      "views_delta_30_days": "Views Δ% 30 days",
      "views_delta_7_days": "Views Δ% 7 days",
      "views_delta_3_days": "Views Δ% 3 days",
      "views_per_subscriber": "Views per subscriber",
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
      `views_last_${timePeriod}_days`, // Dynamic field
      "views_delta_30_days", 
      "views_delta_7_days",
      "views_delta_3_days",
      "views_per_subscriber",
      "channel_creation",
      "channel_id",
      "total_subscribers",
      "total_views",
      "total_uploads"
    ])
    
    // Also add any other views_last_X_days fields as read-only
    if (column.startsWith('views_last_') && column.endsWith('_days')) {
      readOnlyFields.add(column)
    }
    
    const isReadOnly = readOnlyFields.has(column)

    // Special handling for dropdown columns
    if (isEditing && isAdmin && !isReadOnly) {
      if (column === "video_style") {
        return (
          <Select
            value={value || ""}
            onValueChange={(newValue) => {
              updateCell(rowIndex, column, newValue)
              setEditingCell(null)
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="b-rolls">b-rolls</SelectItem>
              <SelectItem value="images">images</SelectItem>
              <SelectItem value="image">image</SelectItem>
            </SelectContent>
          </Select>
        )
      }

      if (column === "thumbnail_style") {
        return (
          <Select
            value={value || ""}
            onValueChange={(newValue) => {
              updateCell(rowIndex, column, newValue)
              setEditingCell(null)
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="text + face, mix of colours">text + face, mix of colours</SelectItem>
              <SelectItem value="text + face, clean colours">text + face, clean colours</SelectItem>
              <SelectItem value="bg image + text">bg image + text</SelectItem>
              <SelectItem value="face + place">face + place</SelectItem>
              <SelectItem value="bright colorful image">bright colorful image</SelectItem>
              <SelectItem value="historical real images">historical real images</SelectItem>
            </SelectContent>
          </Select>
        )
      }

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

    // Format numeric values (views) - handle dynamic column names
    if ((column.startsWith('views_last_') && column.endsWith('_days')) && typeof value === "number") {
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
    
    // Removed formatting for assumption-based fields that have been removed

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

    // Make channel name clickable
    if (column === "channel_name") {
      return (
        <div className="flex items-center gap-2">
          <a 
            href={`https://youtube.com/channel/${row.channel_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors underline cursor-pointer p-1 rounded min-h-[20px] text-xs"
            title="Open YouTube channel"
          >
            {value || ""}
          </a>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </div>
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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Filter by niche:</Label>
            <Select value={selectedNiche} onValueChange={setSelectedNiche}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All niches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All niches</SelectItem>
                {getUniqueNiches().map((niche) => (
                  <SelectItem key={niche} value={niche}>
                    {niche}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox 
              id="sort-by-total-views"
              checked={sortByTotalViews}
              onCheckedChange={handleTotalViewsSort}
            />
            <Label htmlFor="sort-by-total-views" className="text-sm font-medium">
              Sort by total views (highest first)
            </Label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {data.length} channels
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {/* Removed takeoff filter - was based on incorrect assumptions */}

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

            <Button 
              onClick={() => setShowColumnSelection(!showColumnSelection)} 
              variant="outline" 
              size="sm"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Select Columns
            </Button>
            
            <Button 
              onClick={exportSelectedColumnsToXLS} 
              variant="outline" 
              size="sm"
              disabled={selectedColumns.size === 0}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export XLS ({selectedColumns.size} cols)
            </Button>

            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}

        {!isAdmin && (
          <div className="flex items-center gap-2">
            {/* Removed takeoff filter - was based on incorrect assumptions */}

            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Channel Data Analysis</CardTitle>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select
                value={timePeriod}
                onValueChange={setTimePeriod}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 days</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last 1 year</SelectItem>
                  <SelectItem value="1095">Last 3 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table">
                Data Table ({filteredData.length} channels)
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
                    {showColumnSelection && (
                      <TableRow className="bg-muted/50">
                        {columns.map((column) => (
                          <TableHead key={`select-${column}`} className="min-w-[120px] text-center">
                            <Checkbox
                              checked={selectedColumns.has(column)}
                              onCheckedChange={() => toggleColumnSelection(column)}
                              className="mx-auto"
                            />
                          </TableHead>
                        ))}
                      </TableRow>
                    )}
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column} className="min-w-[120px] text-xs">
                          <div 
                            className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded"
                            onClick={() => handleSort(column)}
                          >
                            <span className="flex items-center gap-1">
                              {formatColumnName(column)}
                              <span className="text-muted-foreground text-[10px]">
                                {getSortIcon(column)}
                              </span>
                            </span>
                            {showColumnSelection && (
                              <div className="ml-2">
                                {selectedColumns.has(column) ? (
                                  <CheckSquare className="w-3 h-3 text-primary" />
                                ) : (
                                  <Square className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                            )}
                          </div>
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
