import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_SETTINGS_KEY = "@notification_settings";

export type TonePreference = "gentle" | "accountable";

export interface NotificationSettings {
  dailyReminderEnabled: boolean;
  dailyReminderTime: { hour: number; minute: number };
  streakProtectionEnabled: boolean;
  middayNudgeEnabled: boolean;
  middayNudgeDaysPerWeek: number;
  eveningReflectionEnabled: boolean;
  eveningReflectionTime: { hour: number; minute: number };
  reengagementEnabled: boolean;
  tonePreference: TonePreference;
  /** Hour and minute at which the streak resets. Defaults to 23:59. */
  streakExpiryTime: { hour: number; minute: number };
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  dailyReminderEnabled: true,
  dailyReminderTime: { hour: 8, minute: 0 },
  streakProtectionEnabled: true,
  middayNudgeEnabled: false,
  middayNudgeDaysPerWeek: 3,
  eveningReflectionEnabled: false,
  eveningReflectionTime: { hour: 21, minute: 30 },
  reengagementEnabled: true,
  tonePreference: "gentle",
  streakExpiryTime: { hour: 23, minute: 59 },
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!stored) return { ...DEFAULT_NOTIFICATION_SETTINGS };
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export async function saveNotificationSettings(
  settings: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const current = await getNotificationSettings();
  const merged = { ...current, ...settings };
  await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}
