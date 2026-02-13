import { supabase } from "../lib/supabase";
import type { GuidanceHistoryEntry } from "./dailyGuidance";
import { updateStreak } from "./streak";

export interface Chat {
  id: string;
  user_id: string;
  verse_text: string;
  verse_reference: string;
  user_question: string;
  explanation_data: {
    verse_explanation: string;
    connection_to_user_need: string;
    guidance_application: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// Build guidance path entries from chats (server-backed)
export async function getGuidancePathEntries(): Promise<GuidanceHistoryEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("chats")
    .select("created_at, verse_reference, verse_text")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching guidance path entries:", error);
    return [];
  }

  const entryByDate = new Map<string, GuidanceHistoryEntry>();
  data?.forEach((chat) => {
    const date = new Date(chat.created_at).toISOString().split("T")[0];
    if (!entryByDate.has(date)) {
      entryByDate.set(date, {
        date,
        theme: "Guidance",
        passage: chat.verse_reference,
        verseSnippet: chat.verse_text.substring(0, 60) + (chat.verse_text.length > 60 ? "..." : ""),
      });
    }
  });

  return Array.from(entryByDate.values());
}

// Get all chats for the authenticated user
export async function getChats(): Promise<Chat[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching chats:", error);
    return [];
  }

  return data || [];
}

// Get a single chat by ID
export async function getChat(chatId: string): Promise<Chat | null> {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .single();

  if (error) {
    console.error("Error fetching chat:", error);
    return null;
  }

  return data;
}

// Find an existing chat for a given verse reference created today
export async function findTodaysChatByVerse(verseReference: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("chats")
    .select("id")
    .eq("user_id", user.id)
    .eq("verse_reference", verseReference)
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error finding today's chat:", error);
    return null;
  }

  return data?.id || null;
}

// Create a new chat
export async function createChat(
  verseText: string,
  verseReference: string,
  userQuestion: string,
  explanationData: Chat["explanation_data"]
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Must be logged in to create a chat");
  }

  const { data, error } = await supabase
    .from("chats")
    .insert({
      user_id: user.id,
      verse_text: verseText,
      verse_reference: verseReference,
      user_question: userQuestion,
      explanation_data: explanationData,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating chat:", error);
    throw new Error("Failed to create chat");
  }

  // Update user's streak when they create a new chat (ask for guidance)
  try {
    await updateStreak();
  } catch (streakError) {
    // Don't fail the chat creation if streak update fails
    console.error("Error updating streak:", streakError);
  }

  return data?.id || null;
}

// Get messages for a chat
export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  return data || [];
}

// Add a message to a chat
export async function addChatMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string
): Promise<ChatMessage | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Must be logged in to add a message");
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      chat_id: chatId,
      user_id: user.id,
      role,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding message:", error);
    throw new Error("Failed to add message");
  }

  // Update the chat's updated_at timestamp
  await supabase
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatId);

  return data;
}

// Delete a chat
export async function deleteChat(chatId: string): Promise<void> {
  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", chatId);

  if (error) {
    console.error("Error deleting chat:", error);
    throw new Error("Failed to delete chat");
  }
}

// Delete multiple chats at once
export async function deleteMultipleChats(chatIds: string[]): Promise<void> {
  if (chatIds.length === 0) return;

  const { error } = await supabase
    .from("chats")
    .delete()
    .in("id", chatIds);

  if (error) {
    console.error("Error deleting chats:", error);
    throw new Error("Failed to delete chats");
  }
}

// Reset a chat - keeps only the first N messages (initial explanation + reflection prompt)
export async function resetChatMessages(chatId: string, keepCount: number = 2): Promise<void> {
  // Get all messages for this chat
  const messages = await getChatMessages(chatId);
  
  if (messages.length <= keepCount) {
    // Nothing to reset
    return;
  }

  // Get the IDs of messages to delete (everything after the first keepCount)
  const messageIdsToDelete = messages.slice(keepCount).map(m => m.id);

  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .in("id", messageIdsToDelete);

  if (error) {
    console.error("Error resetting chat messages:", error);
    throw new Error("Failed to reset chat");
  }

  // Update the chat's updated_at timestamp
  await supabase
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatId);
}

