"use client"

import { useEffect, useState } from "react"
import { BookmarkButton } from "@/components/BookmarkButton"
import { addBookmark, getBookmarks, isBookmarked, removeBookmark } from "@/lib/bookmarks"

interface VerseCardProps {
  verseText: string
  verseReference: string
}

export function VerseCard({ verseText, verseReference }: VerseCardProps) {
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    setBookmarked(isBookmarked(verseReference))
  }, [verseReference])

  const handleToggleBookmark = () => {
    if (bookmarked) {
      const existing = getBookmarks().find((bookmark) => bookmark.verseReference === verseReference)
      if (existing) {
        removeBookmark(existing.id)
      }
      setBookmarked(false)
    } else {
      addBookmark({ verseText, verseReference })
      setBookmarked(true)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-4">
          <p className="text-xl font-serif leading-relaxed text-card-foreground sm:text-2xl md:text-3xl">
            "{verseText}"
          </p>
          <p className="text-base font-medium text-primary sm:text-lg">
            — {verseReference}
          </p>
        </div>
        <BookmarkButton 
          isBookmarked={bookmarked} 
          onToggle={handleToggleBookmark}
        />
      </div>
    </div>
  )
}
