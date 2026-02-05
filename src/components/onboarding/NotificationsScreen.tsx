import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  Platform,
  StatusBar,
  Pressable,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { mediumHaptic, successHaptic, lightHaptic } from "../../lib/haptics";
import { MascotBird } from "./MascotBird";
import { WarmBackground } from "./WarmBackground";
import { OB_COLORS, cardShadow, buttonShadow, softShadow } from "./theme";
import { LinearGradient } from "expo-linear-gradient";

interface NotificationsScreenProps {
  preferredTime: string;
  onEnable: () => Promise<boolean>;
  onContinue: () => void;
  onSkip: () => void;
}

export function NotificationsScreen({ preferredTime, onEnable, onContinue, onSkip }: NotificationsScreenProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const insets = useSafeAreaInsets();

  // Confirmation entrance
  const confirmScale = useRef(new Animated.Value(0.5)).current;
  const confirmOpacity = useRef(new Animated.Value(0)).current;

  const handleEnableReminders = async () => {
    if (isEnabling) return;

    mediumHaptic();
    setIsEnabling(true);
    try {
      const permissionGranted = await onEnable();
      if (!permissionGranted) {
        Alert.alert(
          "Reminders not enabled",
          "Notification access is off. You can enable reminders later in Settings.",
          [{ text: "Continue", onPress: onContinue }]
        );
        return;
      }

      successHaptic();
      setShowConfirmation(true);
      const isWeb = Platform.OS === "web";
      if (isWeb) {
        confirmScale.setValue(1);
        confirmOpacity.setValue(1);
      } else {
        Animated.parallel([
          Animated.spring(confirmScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
          Animated.timing(confirmOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      }
      setTimeout(() => onContinue(), 2200);
    } catch {
      Alert.alert(
        "Could not enable reminders",
        "Something went wrong while setting notifications. You can still continue.",
        [{ text: "Continue", onPress: onContinue }]
      );
    } finally {
      setIsEnabling(false);
    }
  };

  if (showConfirmation) {
    return (
      <View style={styles.container}>
        <WarmBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.confirmationContent}>
            <Animated.View style={{ opacity: confirmOpacity, transform: [{ scale: confirmScale }] }}>
              <MascotBird pose="reading" size="large" animate={false} />
            </Animated.View>
            <Animated.View style={[styles.confirmTextWrap, { opacity: confirmOpacity }]}>
              <View style={styles.confirmTitleRow}>
                <Text style={styles.confirmationTitle}>Reminder set!</Text>
                <Ionicons name="sparkles" size={22} color={OB_COLORS.gold} />
              </View>
              <Text style={styles.confirmationSubtitle}>
                We'll send you a gentle reminder at {preferredTime}
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WarmBackground />
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          },
        ]}
      >
        {/* Bird mascot */}
        <View style={styles.mascotRow}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>One last setup</Text>
            <View style={styles.speechTail} />
          </View>
          <MascotBird pose="reading" size="medium" animate delay={100} />
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.subtitleBadge}>DAILY REMINDER</Text>
          <Text style={styles.title}>Want a reminder for{"\n"}your daily time with God?</Text>
          <Text style={styles.subtitle}>We'll send one gentle reminder at your chosen time.</Text>
        </View>

        {/* Notification Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.previewIconContainer}>
              <MaterialCommunityIcons name="bird" size={20} color={OB_COLORS.primary} />
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

        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <Pressable
            style={({ pressed }) => [styles.enableButton, pressed && styles.buttonPressed, isEnabling && styles.buttonDisabled]}
            onPress={handleEnableReminders}
            disabled={isEnabling}
          >
            <LinearGradient
              colors={["#5B8C5A", "#4A7A49"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.enableGradient}
            >
              {isEnabling ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.enableButtonText}>Requesting permission...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="notifications-outline" size={20} color="#ffffff" />
                  <Text style={styles.enableButtonText}>Enable reminders</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.skipButton, pressed && styles.buttonPressed]}
            onPress={() => { lightHaptic(); onSkip(); }}
          >
            <Text style={styles.skipButtonText}>Not now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OB_COLORS.cream },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 8,
  },
  confirmationContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, gap: 24 },
  confirmTextWrap: { alignItems: "center" },
  confirmTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  confirmationTitle: { fontSize: 28, fontWeight: "800", color: OB_COLORS.textDark },
  confirmationSubtitle: { fontSize: 16, color: OB_COLORS.textMuted, textAlign: "center" },

  mascotRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 },
  speechBubble: {
    backgroundColor: OB_COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: OB_COLORS.primaryLight,
    position: "relative",
    ...softShadow,
  },
  speechText: { fontSize: 13, fontWeight: "600", color: OB_COLORS.primary },
  speechTail: {
    position: "absolute",
    right: -6,
    top: "50%",
    marginTop: -4,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: OB_COLORS.primaryLight,
  },

  titleSection: { alignItems: "center", marginBottom: 20, paddingHorizontal: 16 },
  subtitleBadge: { fontSize: 11, fontWeight: "700", color: OB_COLORS.textLight, letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: OB_COLORS.textDark, textAlign: "center", lineHeight: 32, letterSpacing: -0.3, marginBottom: 8 },
  subtitle: { fontSize: 14, color: OB_COLORS.textMuted, textAlign: "center" },

  previewCard: {
    backgroundColor: OB_COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: OB_COLORS.border,
    ...cardShadow,
  },
  previewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  previewIconContainer: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: OB_COLORS.primaryLight,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  previewTextContainer: { flex: 1 },
  previewTitle: { fontSize: 14, fontWeight: "700", color: OB_COLORS.textDark },
  previewTime: { fontSize: 12, color: OB_COLORS.textLight },
  previewMessage: { fontSize: 14, color: OB_COLORS.textBody, lineHeight: 20 },

  spacer: { flex: 1 },

  buttonsContainer: { gap: 12, paddingHorizontal: 16 },
  enableButton: {
    borderRadius: 999,
    overflow: "hidden",
    ...buttonShadow,
  },
  enableGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 18, borderRadius: 999,
  },
  enableButtonText: { fontSize: 17, fontWeight: "700", color: "#ffffff" },
  buttonDisabled: { opacity: 0.75 },
  skipButton: { alignItems: "center", paddingVertical: 14 },
  skipButtonText: { fontSize: 15, fontWeight: "600", color: OB_COLORS.textLight },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
