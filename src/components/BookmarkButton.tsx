"use client"

import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BookmarkButtonProps {
  isBookmarked: boolean
  onToggle: () => void
  isLoading?: boolean
}

export function BookmarkButton({ isBookmarked, onToggle, isLoading }: BookmarkButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      disabled={isLoading}
      className="h-10 w-10 rounded-full"
      title={isBookmarked ? "Remove bookmark" : "Save verse"}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isBookmarked ? (
        <BookmarkCheck className="h-5 w-5 text-primary" />
      ) : (
        <Bookmark className="h-5 w-5" />
      )}
    </Button>
  )
}
