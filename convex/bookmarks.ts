import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getAuthUserId } from "@convex-dev/auth/server"

// Get all bookmarks for the authenticated user
export const getBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return []
    }
    
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect()
    
    return bookmarks
  },
})

// Add a bookmark
export const addBookmark = mutation({
  args: {
    verseText: v.string(),
    verseReference: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Must be logged in to bookmark verses")
    }
    
    // Check if already bookmarked
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_reference", (q) => 
        q.eq("userId", userId).eq("verseReference", args.verseReference)
      )
      .first()
    
    if (existing) {
      return existing._id
    }
    
    const bookmarkId = await ctx.db.insert("bookmarks", {
      userId,
      verseText: args.verseText,
      verseReference: args.verseReference,
      createdAt: Date.now(),
    })
    
    return bookmarkId
  },
})

// Remove a bookmark
export const removeBookmark = mutation({
  args: {
    bookmarkId: v.id("bookmarks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error("Must be logged in")
    }
    
    const bookmark = await ctx.db.get(args.bookmarkId)
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error("Bookmark not found")
    }
    
    await ctx.db.delete(args.bookmarkId)
  },
})

// Check if a verse is bookmarked
export const isBookmarked = query({
  args: {
    verseReference: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return false
    }
    
    const bookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_and_reference", (q) => 
        q.eq("userId", userId).eq("verseReference", args.verseReference)
      )
      .first()
    
    return bookmark !== null
  },
})
