"use client"

import { useState, useEffect } from "react"
import { Plus, Save, Trash2, Edit3, Clock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Note {
  id: number
  created_at: string
  channel_id: string
  note_content: string
  updated_at: string
}

interface NotesModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: string
  channelName: string
}

export function NotesModal({ isOpen, onClose, channelId, channelName }: NotesModalProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const [editingNote, setEditingNote] = useState<{ id: number; content: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && channelId) {
      loadNotes()
    }
  }, [isOpen, channelId])

  const loadNotes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/notes?channelId=${channelId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch notes")
      }
      const notesData = await response.json()
      setNotes(notesData)
    } catch (error) {
      console.error("Failed to load notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNewNote = async () => {
    if (!newNote.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          noteContent: newNote.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save note")
      }

      const savedNote = await response.json()
      setNotes([savedNote, ...notes])
      setNewNote("")
    } catch (error) {
      console.error("Failed to save note:", error)
      alert("Failed to save note. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateNote = async (id: number, content: string) => {
    if (!content.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          noteContent: content.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update note")
      }

      const updatedNote = await response.json()
      setNotes(notes.map(note => note.id === id ? updatedNote : note))
      setEditingNote(null)
    } catch (error) {
      console.error("Failed to update note:", error)
      alert("Failed to update note. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteNote = async (id: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return

    setIsDeleting(id)
    try {
      const response = await fetch(`/api/notes?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete note")
      }

      setNotes(notes.filter(note => note.id !== id))
    } catch (error) {
      console.error("Failed to delete note:", error)
      alert("Failed to delete note. Please try again.")
    } finally {
      setIsDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Notes for {channelName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* New Note Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Add New Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Write your note here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <Button
                onClick={handleSaveNewNote}
                disabled={!newNote.trim() || isSaving}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Note
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Notes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Existing Notes ({notes.length})
              </h3>
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : notes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Edit3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No notes yet. Add your first note above.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <Card key={note.id} className="relative">
                    <CardContent className="p-4">
                      {editingNote?.id === note.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editingNote.content}
                            onChange={(e) =>
                              setEditingNote({ ...editingNote, content: e.target.value })
                            }
                            className="min-h-[80px] resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateNote(note.id, editingNote.content)}
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingNote(null)}
                              disabled={isSaving}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm whitespace-pre-wrap">{note.note_content}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>
                                {note.updated_at !== note.created_at ? "Updated" : "Created"}{" "}
                                {formatDate(note.updated_at || note.created_at)}
                              </span>
                              {note.updated_at !== note.created_at && (
                                <Badge variant="secondary" className="text-xs">
                                  Edited
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setEditingNote({ id: note.id, content: note.note_content })
                                }
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteNote(note.id)}
                                disabled={isDeleting === note.id}
                                className="text-destructive hover:text-destructive"
                              >
                                {isDeleting === note.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

