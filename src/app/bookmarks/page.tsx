"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { useConvexAuth } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { BookmarkList } from "@/components/BookmarkList"
import { AuthModal } from "@/components/AuthModal"
import { Button } from "@/components/ui/button"
import { Loader2, LogIn } from "lucide-react"

export default function BookmarksPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  const bookmarks = useQuery(api.bookmarks.getBookmarks)
  const removeBookmark = useMutation(api.bookmarks.removeBookmark)

  const handleRemove = async (id: string) => {
    await removeBookmark({ bookmarkId: id as any })
  }

  // Transform Convex bookmarks to match expected format
  const formattedBookmarks = bookmarks?.map((b) => ({
    id: b._id,
    verseText: b.verseText,
    verseReference: b.verseReference,
    timestamp: b._creationTime,
  })) ?? []

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 pt-24 sm:pt-28">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <main className="min-h-screen flex items-center justify-center px-4 pt-24 sm:pt-28">
          <div className="text-center max-w-md space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Sign in to view bookmarks</h1>
              <p className="mt-2 text-muted-foreground">
                Create an account or sign in to save and access your favorite verses.
              </p>
            </div>
            <Button
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-primary to-emerald-500"
            >
              Sign in or Create Account
            </Button>
          </div>
        </main>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    )
  }

  return (
    <main className="min-h-screen px-4 pt-24 pb-8 sm:px-6 sm:pt-28 sm:pb-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">My Bookmarks</h1>
          <p className="mt-2 text-muted-foreground">
            Verses you've saved for later reflection.
          </p>
        </div>

        {/* Bookmarks list */}
        {bookmarks === undefined ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <BookmarkList bookmarks={formattedBookmarks} onRemove={handleRemove} />
        )}
      </div>
    </main>
  )
}
