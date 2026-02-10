import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DAILY_REMINDER_ID_KEY = "@daily_reminder_notification_id";
const STREAK_REMINDER_ID_KEY = "@streak_reminder_notification_id";

const DAILY_REMINDER_CHANNEL_ID = "daily-reminders";
const STREAK_REMINDER_CHANNEL_ID = "streak-reminders";

const DEFAULT_STREAK_REMINDER_TIME: NotificationTime = { hour: 23, minute: 30 };

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

let hasConfiguredHandler = false;
let hasConfiguredAndroidChannels = false;

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

async function setupAndroidChannel() {
  if (Platform.OS !== "android" || hasConfiguredAndroidChannels) return;

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
  ]);

  hasConfiguredAndroidChannels = true;
}

function normalizeTime(hour: number, minute: number): NotificationTime {
  return {
    hour: Math.min(23, Math.max(0, Math.floor(hour))),
    minute: Math.min(59, Math.max(0, Math.floor(minute))),
  };
}

function buildDailyTrigger(channelId: string, time: NotificationTime): Notifications.DailyTriggerInput {
  if (Platform.OS === "android") {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: time.hour,
      minute: time.minute,
      channelId,
    };
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour: time.hour,
    minute: time.minute,
  };
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  ensureNotificationHandler();

  const existingPermissions = await Notifications.getPermissionsAsync();
  if (existingPermissions.granted || existingPermissions.status === "granted") {
    return true;
  }

  const requestedPermissions = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return requestedPermissions.granted || requestedPermissions.status === "granted";
}

async function cancelStoredReminder(storageKey: string) {
  const existingReminderId = await getStoredReminderId(storageKey);
  if (!existingReminderId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(existingReminderId);
  } catch {
    // Ignore stale IDs and continue cleanup.
  }

  await AsyncStorage.removeItem(storageKey);
}

async function getStoredReminderId(storageKey: string): Promise<string | null> {
  return AsyncStorage.getItem(storageKey);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyScheduledIdentifiers(
  expectedIdentifiers: string[],
  maxAttempts = 3
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const identifiers = new Set(scheduled.map((request) => request.identifier));

    const hasAll = expectedIdentifiers.every((id) => identifiers.has(id));
    if (hasAll) {
      return true;
    }

    if (attempt < maxAttempts - 1) {
      await sleep(120);
    }
  }

  return false;
}

async function scheduleReminder({
  storageKey,
  channelId,
  title,
  body,
  hour,
  minute,
}: {
  storageKey: string;
  channelId: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
}) {
  const time = normalizeTime(hour, minute);

  await cancelStoredReminder(storageKey);

  const trigger = buildDailyTrigger(channelId, time);

  const reminderId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger,
  });

  await AsyncStorage.setItem(storageKey, reminderId);
  return reminderId;
}

function isSameTime(a: NotificationTime, b: NotificationTime): boolean {
  return a.hour === b.hour && a.minute === b.minute;
}

export async function requestAndScheduleDailyAndStreakReminders(
  dailyTime: NotificationTime,
  options: ReminderScheduleOptions = {}
): Promise<boolean> {
  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    return false;
  }

  await setupAndroidChannel();

  const normalizedDailyTime = normalizeTime(dailyTime.hour, dailyTime.minute);
  const normalizedStreakTime = normalizeTime(
    options.streakTime?.hour ?? DEFAULT_STREAK_REMINDER_TIME.hour,
    options.streakTime?.minute ?? DEFAULT_STREAK_REMINDER_TIME.minute
  );

  try {
    const dailyReminderId = await scheduleReminder({
      storageKey: DAILY_REMINDER_ID_KEY,
      channelId: DAILY_REMINDER_CHANNEL_ID,
      title: "Give Me Guidance",
      body: "Your daily walk is ready. Take 2 minutes to connect with God today.",
      hour: normalizedDailyTime.hour,
      minute: normalizedDailyTime.minute,
    });

    let streakReminderId: string | null = null;
    let shouldScheduleStreak = false;

    if (options.includeStreakReminder ?? true) {
      if (isSameTime(normalizedDailyTime, normalizedStreakTime)) {
        await cancelStoredReminder(STREAK_REMINDER_ID_KEY);
      } else {
        shouldScheduleStreak = true;
        streakReminderId = await scheduleReminder({
          storageKey: STREAK_REMINDER_ID_KEY,
          channelId: STREAK_REMINDER_CHANNEL_ID,
          title: "Keep your streak alive",
          body: "Your streak ends at midnight. Check in with God before the day closes.",
          hour: normalizedStreakTime.hour,
          minute: normalizedStreakTime.minute,
        });
      }
    }

    const expectedIdentifiers = shouldScheduleStreak && streakReminderId
      ? [dailyReminderId, streakReminderId]
      : [dailyReminderId];

    const isVerified = await verifyScheduledIdentifiers(expectedIdentifiers);
    if (!isVerified) {
      console.error("[Notifications] Scheduling verification failed");
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Notifications] Failed to schedule reminders:", error);
    return false;
  }
}

export async function requestAndScheduleDailyReminder(hour: number, minute: number): Promise<boolean> {
  return requestAndScheduleDailyAndStreakReminders(
    { hour, minute },
    { includeStreakReminder: false }
  );
}

export async function cancelDailyReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  await cancelStoredReminder(DAILY_REMINDER_ID_KEY);
}

export async function cancelStreakReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  await cancelStoredReminder(STREAK_REMINDER_ID_KEY);
}

export async function cancelAllReminderNotifications(): Promise<void> {
  if (Platform.OS === "web") return;

  await Promise.all([
    cancelDailyReminder(),
    cancelStreakReminder(),
  ]);
}

export async function getAllScheduledReminderNotifications(): Promise<Notifications.NotificationRequest[]> {
  if (Platform.OS === "web") return [];
  return Notifications.getAllScheduledNotificationsAsync();
}

export async function scheduleReminderTestNotification(delaySeconds = 15): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    return false;
  }

  await setupAndroidChannel();

  const seconds = Math.max(5, Math.floor(delaySeconds));
  const trigger: Notifications.TimeIntervalTriggerInput = Platform.OS === "android"
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
    const reminderId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Give Me Guidance test",
        body: `If you see this, local notifications are working on this device.`,
        sound: true,
      },
      trigger,
    });

    return verifyScheduledIdentifiers([reminderId], 2);
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

  const [permissions, scheduled, dailyReminderId, streakReminderId] = await Promise.all([
    Notifications.getPermissionsAsync(),
    Notifications.getAllScheduledNotificationsAsync(),
    getStoredReminderId(DAILY_REMINDER_ID_KEY),
    getStoredReminderId(STREAK_REMINDER_ID_KEY),
  ]);

  const scheduledIds = new Set(scheduled.map((request) => request.identifier));

  return {
    permissionGranted: permissions.granted || permissions.status === "granted",
    scheduledCount: scheduled.length,
    dailyReminderScheduled: !!dailyReminderId && scheduledIds.has(dailyReminderId),
    streakReminderScheduled: !!streakReminderId && scheduledIds.has(streakReminderId),
    dailyReminderId: dailyReminderId || undefined,
    streakReminderId: streakReminderId || undefined,
  };
}
