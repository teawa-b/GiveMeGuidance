"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { useConvexAuth } from "convex/react"
import { api } from "../../convex/_generated/api"
import { BookmarkButton } from "@/components/BookmarkButton"
import { AuthModal } from "@/components/AuthModal"

interface VerseCardProps {
  verseText: string
  verseReference: string
}

export function VerseCard({ verseText, verseReference }: VerseCardProps) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  const isBookmarkedResult = useQuery(
    api.bookmarks.isBookmarked,
    { verseReference }
  )
  const bookmarks = useQuery(api.bookmarks.getBookmarks)
  
  const addBookmark = useMutation(api.bookmarks.addBookmark)
  const removeBookmark = useMutation(api.bookmarks.removeBookmark)

  const bookmarked = isBookmarkedResult ?? false

  const handleToggleBookmark = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true)
      return
    }

    if (bookmarked) {
      // Find the bookmark to remove
      const bookmark = bookmarks?.find((b) => b.verseReference === verseReference)
      if (bookmark) {
        await removeBookmark({ bookmarkId: bookmark._id })
      }
    } else {
      await addBookmark({ verseText, verseReference })
    }
  }

  return (
    <>
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
            isLoading={authLoading}
          />
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          // Bookmark will be added after successful auth
          addBookmark({ verseText, verseReference })
        }}
      />
    </>
  )
}
