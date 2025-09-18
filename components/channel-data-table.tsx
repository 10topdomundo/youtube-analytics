"use client"

import { useState, useEffect } from "react"
import { Plus, Save, Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface ChannelTableData {
  id: string
  channel_name: string
  channel_niche: string
  channel_language: string
  views_last_30d: number
  views_delta_30d: number
  views_delta_7d: number
  views_delta_3d: number
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
  channel_id: string
  [key: string]: any // Allow dynamic columns
}

interface ChannelDataTableProps {
  isAdmin?: boolean
}

export function ChannelDataTable({ isAdmin = false }: ChannelDataTableProps) {
  const [data, setData] = useState<ChannelTableData[]>([])
  const [filteredData, setFilteredData] = useState<ChannelTableData[]>([])
  const [columns, setColumns] = useState<string[]>([
    "channel_name",
    "channel_niche",
    "channel_language",
    "views_last_30d",
    "views_delta_30d",
    "views_delta_7d",
    "views_delta_3d",
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
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const renderCell = (row: ChannelTableData, column: string, rowIndex: number) => {
    const value = row[column]
    const isEditing = editingCell?.row === rowIndex && editingCell?.col === column

    if (isEditing && isAdmin) {
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

    if (column.includes("views") && typeof value === "number") {
      return (
        <span
          className={isAdmin ? "cursor-pointer hover:bg-muted p-1 rounded" : "p-1"}
          onClick={isAdmin ? () => setEditingCell({ row: rowIndex, col: column }) : undefined}
        >
          {value.toLocaleString()}
        </span>
      )
    }

    if (column === "status") {
      return (
        <Badge
          variant={value === "Active" ? "default" : "secondary"}
          className={isAdmin ? "cursor-pointer" : ""}
          onClick={isAdmin ? () => setEditingCell({ row: rowIndex, col: column }) : undefined}
        >
          {value || "Unknown"}
        </Badge>
      )
    }

    return (
      <span
        className={isAdmin ? "cursor-pointer hover:bg-muted p-1 rounded block min-h-[20px]" : "p-1 block min-h-[20px]"}
        onClick={isAdmin ? () => setEditingCell({ row: rowIndex, col: column }) : undefined}
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
          <CardTitle>
            Channel Data ({filteredData.length} channels)
            {showTakeoffFilter && (
              <Badge variant="secondary" className="ml-2">
                Takeoff Filter Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
