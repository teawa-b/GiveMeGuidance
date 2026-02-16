import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic, successHaptic, lightHaptic, warningHaptic } from "../../lib/haptics";
import type { GuidanceStyle } from "../../lib/OnboardingContext";

interface NotificationsScreenProps {
  toneStyle: GuidanceStyle;
  preferredTime: string; // Display time like "8:00 AM"
  onEnable: () => Promise<boolean>;
  onContinue: () => Promise<void> | void;
  onSkip: () => Promise<void> | void;
}

const TONE_PREVIEW_COPY: Record<GuidanceStyle, { subtitle: string; preview: string }> = {
  gentle: {
    subtitle: "We'll send warm, encouraging reminders at your chosen time.",
    preview: "Your daily walk is ready. Take a peaceful moment to connect with God.",
  },
  direct: {
    subtitle: "We'll send clear, focused reminders at your chosen time.",
    preview: "Time for today's guidance. Take two minutes and complete your daily step.",
  },
  deep: {
    subtitle: "We'll send scripture-focused reminders at your chosen time.",
    preview: "Your daily Scripture reflection is ready. Come back for a deeper study moment.",
  },
};

export function NotificationsScreen({
  toneStyle,
  preferredTime,
  onEnable,
  onContinue,
  onSkip,
}: NotificationsScreenProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const confirmationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toneCopy = TONE_PREVIEW_COPY[toneStyle];

  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
        confirmationTimeoutRef.current = null;
      }
    };
  }, []);

  const handleEnableReminders = async () => {
    if (isEnabling) return;

    mediumHaptic();
    setIsEnabling(true);

    try {
      const enabled = await onEnable();

      if (!enabled) {
        warningHaptic();
        Alert.alert(
          "Notifications are off",
          "Enable notifications in Settings to receive daily and streak reminders.",
          [
            {
              text: "Open Settings",
              onPress: () => {
                Linking.openSettings().catch(() => {
                  // Ignore settings failures and let users continue manually.
                });
              },
            },
            {
              text: "Continue without reminders",
              style: "cancel",
              onPress: () => {
                void onSkip();
              },
            },
          ]
        );
        return;
      }

      successHaptic();
      setShowConfirmation(true);
      confirmationTimeoutRef.current = setTimeout(() => {
        void Promise.resolve(onContinue()).catch((continueError) => {
          console.error("Error continuing after notification setup:", continueError);
        });
      }, 1500);
    } catch (error) {
      console.error("Error enabling notifications:", error);
      warningHaptic();
      Alert.alert(
        "Couldn't enable reminders",
        "There was an issue setting up notifications. You can continue and enable them later.",
        [
          {
            text: "Continue",
            onPress: () => {
              void onSkip();
            },
          },
          { text: "Try again", style: "cancel" },
        ]
      );
    } finally {
      setIsEnabling(false);
    }
  };

  if (showConfirmation) {
    return (
      <View style={styles.container}>
        <EtherealBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.confirmationContent}>
            <View style={styles.confirmationIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#66b083" />
            </View>
            <Text style={styles.confirmationTitle}>Reminder set!</Text>
            <Text style={styles.confirmationSubtitle}>
              Daily reminder at {preferredTime} plus a streak check-in at 11:30 PM.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EtherealBackground />
      <SafeAreaView style={styles.safeArea}>
        {/* Icon */}
        <View style={styles.iconSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="notifications" size={40} color="#66b083" />
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Want a reminder for your daily time with God?</Text>
            <Text style={styles.subtitle}>
              {toneCopy.subtitle}
            </Text>
          </View>

          {/* Preview */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewIconContainer}>
                <MaterialCommunityIcons name="leaf" size={20} color="#66b083" />
              </View>
              <View style={styles.previewTextContainer}>
                <Text style={styles.previewTitle}>Give Me Guidance</Text>
                <Text style={styles.previewTime}>{preferredTime}</Text>
              </View>
            </View>
            <Text style={styles.previewMessage}>
              {toneCopy.preview}
            </Text>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.enableButton,
                isEnabling && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleEnableReminders}
              disabled={isEnabling}
            >
              {isEnabling ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Ionicons name="notifications-outline" size={20} color="#ffffff" />
              )}
              <Text style={styles.enableButtonText}>
                {isEnabling ? "Enabling reminders..." : "Enable reminders"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.skipButton,
                isEnabling && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              disabled={isEnabling}
              onPress={() => {
                lightHaptic();
                void onSkip();
              }}
            >
              <Text style={styles.skipButtonText}>Not now</Text>
            </Pressable>
          </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS !== "ios" && Platform.OS !== "web" ? (StatusBar.currentHeight ?? 0) + 48 : 48,
    paddingBottom: 24,
  },
  confirmationContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  confirmationIcon: {
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  iconSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#66b083",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      default: {
        elevation: 4,
      },
    }),
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  previewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      default: {
        elevation: 4,
      },
    }),
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  previewIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  previewTextContainer: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  previewTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  previewMessage: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  spacer: {
    flex: 1,
  },
  buttonsContainer: {
    gap: 12,
  },
  enableButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#66b083",
    paddingVertical: 18,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#66b083",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      default: {
        elevation: 6,
      },
    }),
  },
  enableButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

