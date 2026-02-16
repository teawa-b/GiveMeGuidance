import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_SETTINGS_KEY = "@notification_settings";

export type TonePreference = "gentle" | "direct" | "deep";
type GuidanceStyleTone = "gentle" | "direct" | "deep";

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

const LEGACY_TONE_PREFERENCE_MAP: Record<string, TonePreference> = {
  accountable: "direct",
};

function normalizeTonePreference(value: unknown): TonePreference {
  if (value === "gentle" || value === "direct" || value === "deep") {
    return value;
  }

  if (typeof value === "string" && LEGACY_TONE_PREFERENCE_MAP[value]) {
    return LEGACY_TONE_PREFERENCE_MAP[value];
  }

  return DEFAULT_NOTIFICATION_SETTINGS.tonePreference;
}

export function tonePreferenceFromGuidanceStyle(style: GuidanceStyleTone): TonePreference {
  return style;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!stored) return { ...DEFAULT_NOTIFICATION_SETTINGS };

    const parsed = JSON.parse(stored);
    const merged = { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed } as NotificationSettings;
    return {
      ...merged,
      tonePreference: normalizeTonePreference(parsed?.tonePreference),
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export async function saveNotificationSettings(
  settings: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const current = await getNotificationSettings();
  const merged = {
    ...current,
    ...settings,
    tonePreference: normalizeTonePreference(settings.tonePreference ?? current.tonePreference),
  };
  await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(merged));
  return merged;
}
