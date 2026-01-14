import { supabase } from "../lib/supabase";

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
}

// Get the user's streak data
export async function getUserStreak(): Promise<UserStreak | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // If no streak record exists, return null (will be created on first activity)
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching streak:", error);
    return null;
  }

  return data;
}

// Check if a date is today (in user's local timezone)
function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// Check if a date is yesterday (in user's local timezone)
function isYesterday(dateString: string): boolean {
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

// Get date string for today in YYYY-MM-DD format (UTC)
function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

// Update streak when user asks for guidance
export async function updateStreak(): Promise<UserStreak | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Must be logged in to update streak");
  }

  const existingStreak = await getUserStreak();
  const todayString = getTodayDateString();

  if (!existingStreak) {
    // Create new streak record
    const { data, error } = await supabase
      .from("user_streaks")
      .insert({
        user_id: user.id,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: todayString,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating streak:", error);
      throw new Error("Failed to create streak");
    }

    return data;
  }

  // If already active today, don't update (streak already counted)
  if (isToday(existingStreak.last_activity_date)) {
    return existingStreak;
  }

  // Calculate new streak
  let newCurrentStreak = 1;
  
  if (isYesterday(existingStreak.last_activity_date)) {
    // Continue the streak
    newCurrentStreak = existingStreak.current_streak + 1;
  }
  // If more than a day has passed, streak resets to 1 (already set above)

  const newLongestStreak = Math.max(existingStreak.longest_streak, newCurrentStreak);

  // Update streak record
  const { data, error } = await supabase
    .from("user_streaks")
    .update({
      current_streak: newCurrentStreak,
      longest_streak: newLongestStreak,
      last_activity_date: todayString,
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating streak:", error);
    throw new Error("Failed to update streak");
  }

  return data;
}

// Get streak with check for staleness (if last activity wasn't yesterday or today, streak is 0)
export async function getCurrentStreakDisplay(): Promise<{
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
}> {
  const streak = await getUserStreak();

  if (!streak) {
    return { currentStreak: 0, longestStreak: 0, isActiveToday: false };
  }

  const isActiveToday = isToday(streak.last_activity_date);
  const wasActiveYesterday = isYesterday(streak.last_activity_date);

  // If last activity was today or yesterday, streak is valid
  if (isActiveToday || wasActiveYesterday) {
    return {
      currentStreak: streak.current_streak,
      longestStreak: streak.longest_streak,
      isActiveToday,
    };
  }

  // Streak has expired (more than a day since last activity)
  return {
    currentStreak: 0,
    longestStreak: streak.longest_streak,
    isActiveToday: false,
  };
}

// Get dates with activity for calendar display
export async function getActivityDates(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // Get distinct dates from chats (using created_at)
  const { data, error } = await supabase
    .from("chats")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching activity dates:", error);
    return [];
  }

  // Extract unique dates
  const uniqueDates = new Set<string>();
  data?.forEach((chat) => {
    const date = new Date(chat.created_at).toISOString().split("T")[0];
    uniqueDates.add(date);
  });

  return Array.from(uniqueDates);
}

// Get chats for a specific date
export async function getChatsForDate(dateString: string): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return [];
  }

  // Query chats where created_at is on the specified date
  const startOfDay = new Date(dateString);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(dateString);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("chats")
    .select("id")
    .eq("user_id", user.id)
    .gte("created_at", startOfDay.toISOString())
    .lte("created_at", endOfDay.toISOString());

  if (error) {
    console.error("Error fetching chats for date:", error);
    return [];
  }

  return data?.map((chat) => chat.id) || [];
}
