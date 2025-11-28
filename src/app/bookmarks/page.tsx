"use client"

import { useState, useEffect } from "react"
import { BookmarkList } from "@/components/BookmarkList"
import { getBookmarks, removeBookmark, type Bookmark } from "@/lib/bookmarks"

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

  useEffect(() => {
    setBookmarks(getBookmarks())
  }, [])

  const handleRemove = (id: string) => {
    removeBookmark(id)
    setBookmarks(getBookmarks())
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">My Bookmarks</h1>
          <p className="mt-2 text-muted-foreground">
            Verses you've saved for later reflection.
          </p>
        </div>

        {/* Bookmarks list */}
        <BookmarkList bookmarks={bookmarks} onRemove={handleRemove} />
      </div>
    </main>
  )
}
