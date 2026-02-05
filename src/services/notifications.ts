import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DAILY_REMINDER_ID_KEY = "@daily_reminder_notification_id";
const DAILY_REMINDER_CHANNEL_ID = "daily-reminders";

let hasConfiguredHandler = false;

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
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL_ID, {
    name: "Daily reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: "#5B8C5A",
  });
}

export async function requestAndScheduleDailyReminder(hour: number, minute: number): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  ensureNotificationHandler();

  const existingPermissions = await Notifications.getPermissionsAsync();
  let status = existingPermissions.status;

  if (status !== "granted") {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    status = requestedPermissions.status;
  }

  if (status !== "granted") {
    return false;
  }

  await setupAndroidChannel();

  const existingReminderId = await AsyncStorage.getItem(DAILY_REMINDER_ID_KEY);
  if (existingReminderId) {
    await Notifications.cancelScheduledNotificationAsync(existingReminderId);
  }

  const trigger: Notifications.DailyTriggerInput = Platform.OS === "android"
    ? {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: DAILY_REMINDER_CHANNEL_ID,
      }
    : {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      };

  const reminderId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Give Me Guidance",
      body: "Your daily walk is ready. Take 2 minutes to connect with God today.",
      sound: true,
    },
    trigger,
  });

  await AsyncStorage.setItem(DAILY_REMINDER_ID_KEY, reminderId);
  return true;
}
