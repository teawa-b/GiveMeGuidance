import AsyncStorage from "@react-native-async-storage/async-storage";
import { getGuidance, getExplanation, type VerseData, type ExplanationData } from "./guidance";

// Storage keys
const DAILY_GUIDANCE_KEY = "daily_guidance";
const GUIDANCE_HISTORY_KEY = "guidance_history";
const DAYS_OF_GUIDANCE_KEY = "days_of_guidance";

export interface DailyGuidance {
  date: string; // YYYY-MM-DD format
  query: string;
  verse: VerseData;
  explanation: ExplanationData | null;
  receivedAt: string; // ISO timestamp
}

export interface GuidanceHistoryEntry {
  date: string;
  theme: string;
  passage: string;
  verseSnippet: string; // First 60 chars of verse text
}

// Get today's date string in YYYY-MM-DD format
function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

// Check if we have today's guidance cached
export async function hasTodaysGuidance(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(DAILY_GUIDANCE_KEY);
    if (!stored) return false;

    const dailyGuidance: DailyGuidance = JSON.parse(stored);
    return dailyGuidance.date === getTodayDateString();
  } catch (error) {
    console.error("Error checking daily guidance:", error);
    return false;
  }
}

// Get today's cached guidance (if exists)
export async function getTodaysGuidance(): Promise<DailyGuidance | null> {
  try {
    const stored = await AsyncStorage.getItem(DAILY_GUIDANCE_KEY);
    if (!stored) return null;

    const dailyGuidance: DailyGuidance = JSON.parse(stored);
    
    // Only return if it's from today
    if (dailyGuidance.date === getTodayDateString()) {
      return dailyGuidance;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting daily guidance:", error);
    return null;
  }
}

// Save today's guidance to cache and history
async function saveDailyGuidance(guidance: DailyGuidance): Promise<void> {
  try {
    // Save as today's guidance
    await AsyncStorage.setItem(DAILY_GUIDANCE_KEY, JSON.stringify(guidance));

    // Add to history
    await addToHistory(guidance);

    // Increment days of guidance counter
    await incrementDaysOfGuidance();
  } catch (error) {
    console.error("Error saving daily guidance:", error);
  }
}

// Fetch fresh guidance for today
export async function fetchDailyGuidance(query: string): Promise<DailyGuidance> {
  const today = getTodayDateString();

  // Gather recently shown verse references to avoid repetition
  const history = await getGuidanceHistory();
  const recentVerses = history.slice(0, 30).map((entry) => entry.passage);

  // Get the verse, passing recent history so the backend avoids repeats
  const verse = await getGuidance(query, recentVerses);

  // Create initial guidance object
  const dailyGuidance: DailyGuidance = {
    date: today,
    query,
    verse,
    explanation: null,
    receivedAt: new Date().toISOString(),
  };

  // Get the explanation
  try {
    const explanation = await getExplanation(
      query,
      verse.text,
      verse.reference.passage,
      verse.translation
    );
    dailyGuidance.explanation = explanation;
  } catch (error) {
    console.error("Error fetching explanation:", error);
  }

  // Save to cache
  await saveDailyGuidance(dailyGuidance);

  return dailyGuidance;
}

// Get or fetch today's guidance
export async function getOrFetchDailyGuidance(query: string): Promise<DailyGuidance> {
  // Check if we already have today's guidance
  const existing = await getTodaysGuidance();
  if (existing) {
    return existing;
  }

  // Fetch fresh guidance
  return fetchDailyGuidance(query);
}

// Add guidance to history
async function addToHistory(guidance: DailyGuidance): Promise<void> {
  try {
    const history = await getGuidanceHistory();
    
    // Create history entry
    const entry: GuidanceHistoryEntry = {
      date: guidance.date,
      theme: guidance.verse.theme || "Guidance",
      passage: guidance.verse.reference.passage,
      verseSnippet: guidance.verse.text.substring(0, 60) + (guidance.verse.text.length > 60 ? "..." : ""),
    };

    // Check if we already have an entry for today
    const existingIndex = history.findIndex((h) => h.date === guidance.date);
    if (existingIndex >= 0) {
      // Update existing entry
      history[existingIndex] = entry;
    } else {
      // Add new entry at the beginning
      history.unshift(entry);
    }

    // Keep only last 90 days
    const trimmedHistory = history.slice(0, 90);

    await AsyncStorage.setItem(GUIDANCE_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error("Error adding to history:", error);
  }
}

// Get guidance history (timeline)
export async function getGuidanceHistory(): Promise<GuidanceHistoryEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(GUIDANCE_HISTORY_KEY);
    if (!stored) return [];

    return JSON.parse(stored);
  } catch (error) {
    console.error("Error getting guidance history:", error);
    return [];
  }
}

// Get days of guidance received count
export async function getDaysOfGuidance(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(DAYS_OF_GUIDANCE_KEY);
    if (!stored) return 0;

    return parseInt(stored, 10);
  } catch (error) {
    console.error("Error getting days of guidance:", error);
    return 0;
  }
}

// Increment days of guidance counter
async function incrementDaysOfGuidance(): Promise<void> {
  try {
    const current = await getDaysOfGuidance();
    await AsyncStorage.setItem(DAYS_OF_GUIDANCE_KEY, String(current + 1));
  } catch (error) {
    console.error("Error incrementing days of guidance:", error);
  }
}

// Get spiritual streak info (not gamified)
export interface SpiritualPresence {
  daysOfGuidance: number; // Total days they've received guidance
  currentPath: number; // Current consecutive days
  isActiveToday: boolean;
}

export async function getSpiritualPresence(): Promise<SpiritualPresence> {
  try {
    const daysOfGuidance = await getDaysOfGuidance();
    const history = await getGuidanceHistory();
    const today = getTodayDateString();

    // Check if active today
    const isActiveToday = history.length > 0 && history[0].date === today;

    // Calculate current consecutive days (path)
    let currentPath = 0;
    const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));

    for (let i = 0; i < sortedHistory.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateString = expectedDate.toISOString().split("T")[0];

      if (sortedHistory[i].date === expectedDateString) {
        currentPath++;
      } else {
        break;
      }
    }

    return {
      daysOfGuidance,
      currentPath,
      isActiveToday,
    };
  } catch (error) {
    console.error("Error getting spiritual presence:", error);
    return {
      daysOfGuidance: 0,
      currentPath: 0,
      isActiveToday: false,
    };
  }
}

// Clear all daily guidance data (for testing/debugging)
export async function clearDailyGuidanceData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      DAILY_GUIDANCE_KEY,
      GUIDANCE_HISTORY_KEY,
      DAYS_OF_GUIDANCE_KEY,
    ]);
  } catch (error) {
    console.error("Error clearing daily guidance data:", error);
  }
}
