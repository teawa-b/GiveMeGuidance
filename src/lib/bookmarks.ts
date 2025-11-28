export interface Bookmark {
  id: string
  verseText: string
  verseReference: string
  timestamp: number
}

const STORAGE_KEY = "givemeguidance_bookmarks"

export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export function addBookmark(bookmark: Omit<Bookmark, "id" | "timestamp">): Bookmark {
  const bookmarks = getBookmarks()
  const newBookmark: Bookmark = {
    ...bookmark,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
  bookmarks.unshift(newBookmark)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
  return newBookmark
}

export function removeBookmark(id: string): void {
  const bookmarks = getBookmarks().filter((b) => b.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
}

export function isBookmarked(verseReference: string): boolean {
  return getBookmarks().some((b) => b.verseReference === verseReference)
}
