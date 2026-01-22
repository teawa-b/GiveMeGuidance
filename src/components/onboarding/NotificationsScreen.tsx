import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Pressable,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic, successHaptic, lightHaptic } from "../../lib/haptics";

interface NotificationsScreenProps {
  preferredTime: string; // Display time like "8:00 AM"
  onEnable: () => void;
  onSkip: () => void;
}

export function NotificationsScreen({
  preferredTime,
  onEnable,
  onSkip,
}: NotificationsScreenProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleEnableReminders = async () => {
    mediumHaptic();

    try {
      // For now, we'll just show confirmation and proceed
      // Actual notification scheduling would be implemented with expo-notifications
      successHaptic();
      setShowConfirmation(true);
      setTimeout(() => {
        onEnable();
      }, 2000);
    } catch (error) {
      console.error("Error requesting notifications permission:", error);
      // Still proceed even if there's an error
      successHaptic();
      setShowConfirmation(true);
      setTimeout(() => {
        onEnable();
      }, 2000);
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
              We'll send you a gentle reminder at {preferredTime}
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
        <View style={styles.content}>
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
              We'll send one gentle reminder at your chosen time.
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
              Your daily walk is ready. Take 2 minutes to connect with God today.
            </Text>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.enableButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleEnableReminders}
            >
              <Ionicons name="notifications-outline" size={20} color="#ffffff" />
              <Text style={styles.enableButtonText}>Enable reminders</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                lightHaptic();
                onSkip();
              }}
            >
              <Text style={styles.skipButtonText}>Not now</Text>
            </Pressable>
          </View>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 40 : 40,
    paddingBottom: 32,
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
      android: {
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
      android: {
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
      android: {
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
});
