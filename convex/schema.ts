import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"

export default defineSchema({
  ...authTables,
  bookmarks: defineTable({
    userId: v.id("users"),
    verseText: v.string(),
    verseReference: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_reference", ["userId", "verseReference"]),
})
