import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  getNotificationSettings,
  type NotificationSettings,
} from "./notificationSettings";
import {
  dailyReminderText,
  middayNudgeText,
  eveningReflectionText,
  streakWarn4hText,
  streakWarn1hText,
  streakFinalText,
  milestoneText,
  reengage2dText,
  reengage5dText,
  reengageWeeklyText,
} from "./notificationTexts";

// ── Storage keys (legacy kept for backward compat) ──────────────────
const DAILY_REMINDER_ID_KEY = "@daily_reminder_notification_id";
const STREAK_REMINDER_ID_KEY = "@streak_reminder_notification_id";
const SCHEDULED_IDS_KEY = "@scheduled_notification_ids";
const LAST_COMPLETION_DATE_KEY = "@last_completion_date";
const APP_OPEN_COUNT_KEY = "@app_open_count";

// ── Android channel IDs ─────────────────────────────────────────────
const DAILY_REMINDER_CHANNEL_ID = "daily-reminders";
const STREAK_REMINDER_CHANNEL_ID = "streak-reminders";
const REENGAGEMENT_CHANNEL_ID = "reengagement";

// ── Milestone thresholds ────────────────────────────────────────────
const MILESTONE_STREAKS = [7, 14, 30, 60, 100];
const MILESTONE_DELAY_MS = 2000;

// ── Exported types (kept for backward compat) ───────────────────────
export interface NotificationTime {
  hour: number;
  minute: number;
}

interface ReminderScheduleOptions {
  includeStreakReminder?: boolean;
  streakTime?: NotificationTime;
}

export interface ReminderScheduleSnapshot {
  permissionGranted: boolean;
  scheduledCount: number;
  dailyReminderScheduled: boolean;
  streakReminderScheduled: boolean;
  dailyReminderId?: string;
  streakReminderId?: string;
}

// ── Module state ────────────────────────────────────────────────────
let hasConfiguredHandler = false;
let hasConfiguredAndroidChannels = false;

// ── Europe/London date helpers ──────────────────────────────────────

function getLondonDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

function getLondonHourMinute(date: Date = new Date()): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  return {
    hour: Number(parts.find((p) => p.type === "hour")!.value),
    minute: Number(parts.find((p) => p.type === "minute")!.value),
  };
}

/** Build a Date for the given date-string (YYYY-MM-DD) at h:m in Europe/London. */
function londonDateAt(dateStr: string, hour: number, minute: number): Date {
  // Try a few UTC offsets to find the one that lands on the right London time.
  // This handles BST (UTC+1) and GMT (UTC+0) correctly.
  const [y, m, d] = dateStr.split("-").map(Number);
  const estimate = new Date(Date.UTC(y, m - 1, d, hour, minute, 0));
  for (let offset = -2; offset <= 2; offset++) {
    const candidate = new Date(estimate.getTime() + offset * 3600_000);
    const londonStr = getLondonDateString(candidate);
    const londonTime = getLondonHourMinute(candidate);
    if (londonStr === dateStr && londonTime.hour === hour && londonTime.minute === minute) {
      return candidate;
    }
  }
  return estimate;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return getLondonDateString(date);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T12:00:00Z");
  const db = new Date(b + "T12:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

// ── Notification ID builders (deterministic per category + date) ────

function notifId(category: string, dateStr: string, extra?: string): string {
  const tag = dateStr.replace(/-/g, "");
  return extra ? `${category}_${tag}_${extra}` : `${category}_${tag}`;
}

// ── Low-level helpers ───────────────────────────────────────────────

function ensureNotificationHandler() {
  if (hasConfiguredHandler) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  hasConfiguredHandler = true;
}

async function setupAndroidChannels() {
  if (Platform.OS === "ios" || Platform.OS === "web" || hasConfiguredAndroidChannels) return;

  await Promise.all([
    Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL_ID, {
      name: "Daily reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: "#5B8C5A",
    }),
    Notifications.setNotificationChannelAsync(STREAK_REMINDER_CHANNEL_ID, {
      name: "Streak reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 120, 250],
      lightColor: "#D97706",
    }),
    Notifications.setNotificationChannelAsync(REENGAGEMENT_CHANNEL_ID, {
      name: "Come back reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 120, 200],
      lightColor: "#5B8C5A",
    }),
  ]);

  hasConfiguredAndroidChannels = true;
}

function normalizeTime(hour: number, minute: number): NotificationTime {
  return {
    hour: Math.min(23, Math.max(0, Math.floor(hour))),
    minute: Math.min(59, Math.max(0, Math.floor(minute))),
  };
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  ensureNotificationHandler();

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted || existing.status === "granted") return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });

  return requested.granted || requested.status === "granted";
}

// ── Stored IDs management ───────────────────────────────────────────

async function getStoredIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function setStoredIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(ids));
}

async function cancelAllScheduledIds(): Promise<void> {
  const ids = await getStoredIds();
  await Promise.all(
    ids.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {
        /* stale id */
      }),
    ),
  );
  await setStoredIds([]);
  // Also clear legacy keys
  await AsyncStorage.multiRemove([DAILY_REMINDER_ID_KEY, STREAK_REMINDER_ID_KEY]).catch(() => {});
}

// ── Scheduling a single notification at an absolute Date ────────────

interface ScheduleOneParams {
  identifier: string;
  title: string;
  body: string;
  date: Date;
  channelId: string;
}

async function scheduleOne(params: ScheduleOneParams): Promise<string | null> {
  const secondsFromNow = Math.floor((params.date.getTime() - Date.now()) / 1000);
  if (secondsFromNow <= 0) return null; // In the past – skip.

  const trigger: Notifications.TimeIntervalTriggerInput =
    Platform.OS !== "ios" && Platform.OS !== "web"
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow,
          repeats: false,
          channelId: params.channelId,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow,
          repeats: false,
        };

  try {
    const id = await Notifications.scheduleNotificationAsync({
      identifier: params.identifier,
      content: {
        title: params.title,
        body: params.body,
        sound: true,
      },
      trigger,
    });
    return id;
  } catch (e) {
    console.error(`[Notifications] Failed to schedule ${params.identifier}:`, e);
    return null;
  }
}

// ── Completion tracking ─────────────────────────────────────────────

export async function getLastCompletionDate(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_COMPLETION_DATE_KEY);
}

export async function setLastCompletionDate(dateStr: string): Promise<void> {
  await AsyncStorage.setItem(LAST_COMPLETION_DATE_KEY, dateStr);
}

async function hasCompletedToday(): Promise<boolean> {
  const last = await getLastCompletionDate();
  return last === getLondonDateString();
}

// ── App open tracking (for C2 usage milestone) ──────────────────────

export async function incrementAppOpenCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(APP_OPEN_COUNT_KEY);
    const count = (raw ? parseInt(raw, 10) : 0) + 1;
    await AsyncStorage.setItem(APP_OPEN_COUNT_KEY, String(count));
    return count;
  } catch {
    return 0;
  }
}

// ── Core scheduling engine ──────────────────────────────────────────

/**
 * Recompute and reschedule the next 7 days of notifications.
 * Call this on every app open, after settings change, or after completion.
 */
export async function rescheduleAllNotifications(streakCount = 0): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return false;

  await setupAndroidChannels();

  const settings = await getNotificationSettings();
  const now = new Date();
  const todayStr = getLondonDateString(now);
  const completedToday = await hasCompletedToday();
  const lastCompletionDate = await getLastCompletionDate();

  // Cancel everything we previously scheduled
  await cancelAllScheduledIds();

  const scheduledIds: string[] = [];
  const daySlots: Map<string, number> = new Map(); // dateStr → count of notifications scheduled

  const incSlot = (d: string) => daySlots.set(d, (daySlots.get(d) ?? 0) + 1);
  const dayCount = (d: string) => daySlots.get(d) ?? 0;
  const weekTotal = () => {
    let sum = 0;
    daySlots.forEach((v) => (sum += v));
    return sum;
  };

  // Determine if streak is at risk today (not completed, protection on)
  const streakAtRisk = !completedToday && settings.streakProtectionEnabled && streakCount > 0;
  const maxPerDay = (d: string) => {
    if (d === todayStr && streakAtRisk) return 3;
    return 2;
  };

  // Helper: try to add a notification, respecting caps
  const trySchedule = async (
    p: Omit<ScheduleOneParams, "channelId"> & { channelId?: string; dateStr: string },
  ) => {
    const dateStr = p.dateStr;
    if (dayCount(dateStr) >= maxPerDay(dateStr)) return;
    if (weekTotal() >= 7) return;

    const id = await scheduleOne({
      ...p,
      channelId: p.channelId ?? DAILY_REMINDER_CHANNEL_ID,
    });
    if (id) {
      scheduledIds.push(id);
      incSlot(dateStr);
    }
  };

  // ── Schedule each day for the next 7 days ─────────────────────────
  // Pick midday nudge days deterministically for the week (stable across re-schedules)
  const middayDays = pickDaysDeterministic(7, settings.middayNudgeDaysPerWeek, todayStr);

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dateStr = addDays(todayStr, dayOffset);
    const isToday = dayOffset === 0;
    const completedThisDay = isToday ? completedToday : false; // Future days: assume not completed.

    // ── A1 Daily reminder ─────────────────────────────────────────
    if (settings.dailyReminderEnabled && !completedThisDay) {
      let { hour, minute } = settings.dailyReminderTime;

      // Rule 5: if daily reminder is after streak expiry, move it 2h before expiry
      const expiryMinutes = settings.streakExpiryTime.hour * 60 + settings.streakExpiryTime.minute;
      const reminderMinutes = hour * 60 + minute;
      if (reminderMinutes >= expiryMinutes) {
        const adjusted = expiryMinutes - 120;
        if (adjusted > 0) {
          hour = Math.floor(adjusted / 60);
          minute = adjusted % 60;
        }
      }

      const fireAt = londonDateAt(dateStr, hour, minute);
      const text = dailyReminderText(settings.tonePreference, dateStr);
      await trySchedule({
        identifier: notifId("dailyReminder", dateStr),
        title: text.title,
        body: text.body,
        date: fireAt,
        dateStr,
      });
    }

    // ── A2 Midday nudge ───────────────────────────────────────────
    if (settings.middayNudgeEnabled && middayDays.includes(dayOffset) && !completedThisDay) {
      const { hour: nudgeHour, minute: nudgeMinute } = deterministicMiddayTime(dateStr);
      const fireAt = londonDateAt(dateStr, nudgeHour, nudgeMinute);
      const text = middayNudgeText(settings.tonePreference, dateStr);
      await trySchedule({
        identifier: notifId("middayNudge", dateStr),
        title: text.title,
        body: text.body,
        date: fireAt,
        dateStr,
      });
    }

    // ── A3 Evening reflection ─────────────────────────────────────
    if (settings.eveningReflectionEnabled && !completedThisDay) {
      const { hour, minute } = settings.eveningReflectionTime;
      const fireAt = londonDateAt(dateStr, hour, minute);
      const text = eveningReflectionText(settings.tonePreference, dateStr);
      await trySchedule({
        identifier: notifId("eveningReflection", dateStr),
        title: text.title,
        body: text.body,
        date: fireAt,
        dateStr,
      });
    }

    // ── B Streak protection (only if not completed) ───────────────
    if (settings.streakProtectionEnabled && !completedThisDay && streakCount > 0) {
      const { hour: eh, minute: em } = settings.streakExpiryTime;

      // B1 – 4 hours before expiry
      const b1 = londonDateAt(dateStr, eh, em);
      b1.setTime(b1.getTime() - 4 * 3600_000);
      const textB1 = streakWarn4hText(settings.tonePreference, dateStr);
      await trySchedule({
        identifier: notifId("streakWarn4h", dateStr),
        title: textB1.title,
        body: textB1.body,
        date: b1,
        channelId: STREAK_REMINDER_CHANNEL_ID,
        dateStr,
      });

      // B2 – 1 hour before expiry
      const b2 = londonDateAt(dateStr, eh, em);
      b2.setTime(b2.getTime() - 1 * 3600_000);
      const textB2 = streakWarn1hText(settings.tonePreference, dateStr);
      await trySchedule({
        identifier: notifId("streakWarn1h", dateStr),
        title: textB2.title,
        body: textB2.body,
        date: b2,
        channelId: STREAK_REMINDER_CHANNEL_ID,
        dateStr,
      });

      // B3 – 15 minutes before expiry (only if streak >= 5)
      if (streakCount >= 5) {
        const b3 = londonDateAt(dateStr, eh, em);
        b3.setTime(b3.getTime() - 15 * 60_000);
        const textB3 = streakFinalText(settings.tonePreference, streakCount, dateStr);
        await trySchedule({
          identifier: notifId("streakFinal", dateStr),
          title: textB3.title,
          body: textB3.body,
          date: b3,
          channelId: STREAK_REMINDER_CHANNEL_ID,
          dateStr,
        });
      }
    }
  }

  // ── D Re-engagement ─────────────────────────────────────────────
  if (settings.reengagementEnabled && lastCompletionDate && !completedToday) {
    const inactiveDays = daysBetween(lastCompletionDate, todayStr);

    if (inactiveDays >= 2) {
      // D1 – 2 days inactive
      if (inactiveDays === 2) {
        const dateStr = todayStr;
        const fireAt = londonDateAt(dateStr, 18, 0);
        const text = reengage2dText(settings.tonePreference, dateStr);
        await trySchedule({
          identifier: notifId("reengage2d", dateStr),
          title: text.title,
          body: text.body,
          date: fireAt,
          channelId: REENGAGEMENT_CHANNEL_ID,
          dateStr,
        });
      }

      // D2 – 5 days inactive (schedule when between 3-5 days so it fires on day 5)
      if (inactiveDays > 2 && inactiveDays <= 5) {
        const targetDateStr = addDays(lastCompletionDate, 5);
        const fireAt = londonDateAt(targetDateStr, 18, 0);
        if (fireAt.getTime() > Date.now()) {
          const text = reengage5dText(settings.tonePreference, targetDateStr);
          await trySchedule({
            identifier: notifId("reengage5d", targetDateStr),
            title: text.title,
            body: text.body,
            date: fireAt,
            channelId: REENGAGEMENT_CHANNEL_ID,
            dateStr: targetDateStr,
          });
        }
      }

      // D3 – 7+ days: schedule weekly check-ins
      if (inactiveDays >= 7) {
        // Fire at 18:00 every 7 days from when they became inactive
        for (let w = 1; w <= 4; w++) {
          const targetDateStr = addDays(lastCompletionDate, 7 * w);
          const fireAt = londonDateAt(targetDateStr, 18, 0);
          if (fireAt.getTime() > Date.now() && weekTotal() < 7) {
            const text = reengageWeeklyText(settings.tonePreference, targetDateStr);
            await trySchedule({
              identifier: notifId("reengageWeekly", targetDateStr),
              title: text.title,
              body: text.body,
              date: fireAt,
              channelId: REENGAGEMENT_CHANNEL_ID,
              dateStr: targetDateStr,
            });
          }
        }
      }
    }
  }

  await setStoredIds(scheduledIds);
  return true;
}

// ── Called when user completes today's devotion ─────────────────────

export async function onDailyCompletion(streakCount: number): Promise<void> {
  if (Platform.OS === "web") return;

  const todayStr = getLondonDateString();
  const settings = await getNotificationSettings();
  await setLastCompletionDate(todayStr);

  // Cancel same-day notifications in categories A2, A3, B1, B2, B3, and D*
  const categoriesToCancel = [
    "middayNudge",
    "eveningReflection",
    "streakWarn4h",
    "streakWarn1h",
    "streakFinal",
    "reengage2d",
    "reengage5d",
    "reengageWeekly",
  ];

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const idsToCancel: string[] = [];
  for (const req of scheduled) {
    for (const cat of categoriesToCancel) {
      if (req.identifier.startsWith(cat + "_")) {
        idsToCancel.push(req.identifier);
        break;
      }
    }
  }

  await Promise.all(
    idsToCancel.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})),
  );

  // C1 – Milestone celebration
  if (MILESTONE_STREAKS.includes(streakCount)) {
    const text = milestoneText(settings.tonePreference, streakCount, todayStr);
    await scheduleOne({
      identifier: notifId("milestone", todayStr, String(streakCount)),
      title: text.title,
      body: text.body,
      date: new Date(Date.now() + MILESTONE_DELAY_MS),
      channelId: DAILY_REMINDER_CHANNEL_ID,
    });
  }

  // Re-schedule remaining future notifications
  await rescheduleAllNotifications(streakCount);
}

// ── Deterministic day picker for midday nudge ───────────────────────

/** Simple numeric hash from a string, used for deterministic random selection. */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Pick `count` days from 0..totalDays-1 deterministically based on a seed string.
 * The same seed always produces the same selection.
 */
function pickDaysDeterministic(totalDays: number, count: number, seed: string): number[] {
  const pool = Array.from({ length: totalDays }, (_, i) => i);
  const picked: number[] = [];
  const n = Math.min(count, totalDays);
  let h = simpleHash(seed);
  for (let i = 0; i < n; i++) {
    const idx = h % pool.length;
    picked.push(pool[idx]);
    pool.splice(idx, 1);
    h = simpleHash(seed + String(i));
  }
  return picked;
}

/** Deterministic midday time (12:00-13:59) based on seed. */
function deterministicMiddayTime(seed: string): { hour: number; minute: number } {
  const h = simpleHash(seed);
  return { hour: 12 + (h % 2), minute: h % 60 };
}

// ── Legacy / backward-compatible exports ────────────────────────────

export async function requestAndScheduleDailyAndStreakReminders(
  dailyTime: NotificationTime,
  _options: ReminderScheduleOptions = {},
): Promise<boolean> {
  // Save the daily time to settings then reschedule everything
  const { saveNotificationSettings } = await import("./notificationSettings");
  await saveNotificationSettings({
    dailyReminderTime: normalizeTime(dailyTime.hour, dailyTime.minute),
  });
  return rescheduleAllNotifications();
}

export async function requestAndScheduleDailyReminder(hour: number, minute: number): Promise<boolean> {
  return requestAndScheduleDailyAndStreakReminders({ hour, minute }, { includeStreakReminder: false });
}

export async function cancelDailyReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  await cancelAllScheduledIds();
}

export async function cancelStreakReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  // Streak reminders are now part of the full schedule; cancel all.
  await cancelAllScheduledIds();
}

export async function cancelAllReminderNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await cancelAllScheduledIds();
}

export async function getAllScheduledReminderNotifications(): Promise<Notifications.NotificationRequest[]> {
  if (Platform.OS === "web") return [];
  return Notifications.getAllScheduledNotificationsAsync();
}

export async function scheduleReminderTestNotification(delaySeconds = 15): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return false;

  await setupAndroidChannels();

  const seconds = Math.max(5, Math.floor(delaySeconds));
  const trigger: Notifications.TimeIntervalTriggerInput =
    Platform.OS !== "ios"
      ? {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          repeats: false,
          channelId: DAILY_REMINDER_CHANNEL_ID,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          repeats: false,
        };

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Give Me Guidance test",
        body: "If you see this, local notifications are working on this device.",
        sound: true,
      },
      trigger,
    });
    return true;
  } catch (error) {
    console.error("[Notifications] Failed to schedule test notification:", error);
    return false;
  }
}

export async function getReminderScheduleSnapshot(): Promise<ReminderScheduleSnapshot> {
  if (Platform.OS === "web") {
    return {
      permissionGranted: false,
      scheduledCount: 0,
      dailyReminderScheduled: false,
      streakReminderScheduled: false,
    };
  }

  ensureNotificationHandler();

  const [permissions, scheduled] = await Promise.all([
    Notifications.getPermissionsAsync(),
    Notifications.getAllScheduledNotificationsAsync(),
  ]);

  const ids = scheduled.map((r) => r.identifier);
  const hasDaily = ids.some((id) => id.startsWith("dailyReminder_"));
  const hasStreak = ids.some(
    (id) => id.startsWith("streakWarn4h_") || id.startsWith("streakWarn1h_") || id.startsWith("streakFinal_"),
  );

  return {
    permissionGranted: permissions.granted || permissions.status === "granted",
    scheduledCount: scheduled.length,
    dailyReminderScheduled: hasDaily,
    streakReminderScheduled: hasStreak,
  };
}

