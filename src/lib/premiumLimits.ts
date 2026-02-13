/**
 * Premium feature limits & daily usage tracking.
 *
 * Free limits (per calendar day):
 *  - "Give me another verse" refreshes: 3
 *  - Chat messages sent: 15
 *
 * Premium users: unlimited for both.
 *
 * Guidance history:
 *  - Free: last 7 days
 *  - Premium: unlimited
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

// â”€â”€ Limits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const FREE_VERSE_REFRESH_LIMIT = 3;
export const FREE_CHAT_MESSAGE_LIMIT = 15;
export const FREE_HISTORY_DAYS = 7;

// â”€â”€ Internal helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const todayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const VERSE_REFRESH_KEY = "premium_verse_refreshes";
const CHAT_MSG_KEY = "premium_chat_messages";

interface DailyCounter {
  date: string;
  count: number;
}

async function getCounter(storageKey: string): Promise<DailyCounter> {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    if (raw) {
      const parsed: DailyCounter = JSON.parse(raw);
      if (parsed.date === todayKey()) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return { date: todayKey(), count: 0 };
}

async function incrementCounter(storageKey: string): Promise<DailyCounter> {
  const counter = await getCounter(storageKey);
  counter.count += 1;
  counter.date = todayKey();
  await AsyncStorage.setItem(storageKey, JSON.stringify(counter));
  return counter;
}

// â”€â”€ Public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Get today's verse-refresh usage. */
export async function getVerseRefreshUsage(): Promise<{ used: number; limit: number }> {
  const counter = await getCounter(VERSE_REFRESH_KEY);
  return { used: counter.count, limit: FREE_VERSE_REFRESH_LIMIT };
}

/** Record one verse refresh. Returns updated count. */
export async function recordVerseRefresh(): Promise<number> {
  const counter = await incrementCounter(VERSE_REFRESH_KEY);
  return counter.count;
}

/** Get today's chat-message usage. */
export async function getChatMessageUsage(): Promise<{ used: number; limit: number }> {
  const counter = await getCounter(CHAT_MSG_KEY);
  return { used: counter.count, limit: FREE_CHAT_MESSAGE_LIMIT };
}

/** Record one chat message sent. Returns updated count. */
export async function recordChatMessage(): Promise<number> {
  const counter = await incrementCounter(CHAT_MSG_KEY);
  return counter.count;
}

/** Check if free user can refresh verse. */
export async function canRefreshVerse(isPremium: boolean): Promise<boolean> {
  if (isPremium) return true;
  const { used, limit } = await getVerseRefreshUsage();
  return used < limit;
}

/** Check if free user can send chat message. */
export async function canSendChatMessage(isPremium: boolean): Promise<boolean> {
  if (isPremium) return true;
  const { used, limit } = await getChatMessageUsage();
  return used < limit;
}

