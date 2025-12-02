"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { BookmarkList } from "@/components/BookmarkList"
import type { Bookmark } from "@/lib/bookmarks"
import { getBookmarks, removeBookmark } from "@/lib/bookmarks"

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setBookmarks(getBookmarks())
    setIsHydrated(true)
  }, [])

  const handleRemove = (id: string) => {
    removeBookmark(id)
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))
  }

  if (!isHydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 pt-24 sm:pt-28">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 pt-24 pb-8 sm:px-6 sm:pt-28 sm:pb-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">My Bookmarks</h1>
          <p className="mt-2 text-muted-foreground">
            Verses you've saved in this browser.
          </p>
        </div>

        <BookmarkList bookmarks={bookmarks} onRemove={handleRemove} />

        <p className="mt-6 text-sm text-muted-foreground">
          Bookmarks are stored locally. Clear your browser data to remove them completely.
        </p>
      </div>
    </main>
  )
}
