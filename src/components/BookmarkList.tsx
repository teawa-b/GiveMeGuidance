"use client"

import { Bookmark as BookmarkIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Bookmark } from "@/lib/bookmarks"

interface BookmarkListProps {
  bookmarks: Bookmark[]
  onRemove: (id: string) => void
}

export function BookmarkList({ bookmarks, onRemove }: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <BookmarkIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No saved verses yet</h3>
        <p className="text-muted-foreground max-w-sm">
          When you find a verse that speaks to you, save it here to revisit later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <p className="font-medium text-primary">{bookmark.verseReference}</p>
              <p className="text-card-foreground leading-relaxed">"{bookmark.verseText}"</p>
              <p className="text-xs text-muted-foreground">
                Saved on {new Date(bookmark.timestamp).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(bookmark.id)}
              className="h-9 w-9 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
