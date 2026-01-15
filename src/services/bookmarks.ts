import { supabase, Bookmark } from "../lib/supabase";

export type { Bookmark };

// Get all bookmarks for the authenticated user
export async function getBookmarks(): Promise<Bookmark[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bookmarks:", error);
    return [];
  }

  return data || [];
}

// Add a bookmark
export async function addBookmark(verseText: string, verseReference: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Must be logged in to bookmark verses");
  }

  // Check if already bookmarked
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("verse_reference", verseReference)
    .single();

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: user.id,
      verse_text: verseText,
      verse_reference: verseReference,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error adding bookmark:", error);
    throw new Error("Failed to add bookmark");
  }

  return data?.id || null;
}

// Remove a bookmark
export async function removeBookmark(bookmarkId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Must be logged in");
  }

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error removing bookmark:", error);
    throw new Error("Failed to remove bookmark");
  }
}

// Remove multiple bookmarks
export async function removeMultipleBookmarks(bookmarkIds: string[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Must be logged in");
  }

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .in("id", bookmarkIds)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error removing bookmarks:", error);
    throw new Error("Failed to remove bookmarks");
  }
}

// Check if a verse is bookmarked
export async function isBookmarked(verseReference: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("verse_reference", verseReference)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows found - verse is not bookmarked
      return false;
    }
    // Other error - assume not bookmarked
    console.error("Error checking bookmark:", error);
    return false;
  }

  return !!data;
}
