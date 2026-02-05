import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { mediumHaptic, successHaptic, lightHaptic } from "../../lib/haptics";
import { MascotBird } from "./MascotBird";
import { WarmBackground } from "./WarmBackground";
import { OB_COLORS, cardShadow, buttonShadow, softShadow } from "./theme";
import { LinearGradient } from "expo-linear-gradient";

interface NotificationsScreenProps {
  preferredTime: string;
  onEnable: () => void;
  onSkip: () => void;
}

export function NotificationsScreen({ preferredTime, onEnable, onSkip }: NotificationsScreenProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Confirmation entrance
  const confirmScale = useRef(new Animated.Value(0.5)).current;
  const confirmOpacity = useRef(new Animated.Value(0)).current;

  const handleEnableReminders = async () => {
    mediumHaptic();
    try {
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
      setTimeout(() => onEnable(), 2200);
    } catch {
      successHaptic();
      setShowConfirmation(true);
      setTimeout(() => onEnable(), 2200);
    }
  };

  if (showConfirmation) {
    return (
      <View style={styles.container}>
        <WarmBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.confirmationContent}>
            <Animated.View style={{ opacity: confirmOpacity, transform: [{ scale: confirmScale }] }}>
              <MascotBird pose="pointing-up" size="large" animate={false} />
            </Animated.View>
            <Animated.View style={[styles.confirmTextWrap, { opacity: confirmOpacity }]}>
              <Text style={styles.confirmationTitle}>Reminder set! <Ionicons name="sparkles" size={22} color={OB_COLORS.gold} /></Text>
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
      <SafeAreaView style={styles.safeArea}>
        {/* Bird pointing at notification */}
        <View style={styles.mascotSection}>
          <MascotBird pose="pointing-right" size="medium" animate delay={100} />
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Want a reminder for{"\n"}your daily time with God?</Text>
          <Text style={styles.subtitle}>We'll send one gentle reminder at your chosen time.</Text>
        </View>

        {/* Notification Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.previewIconContainer}>
              <Text style={{ fontSize: 18 }}><MaterialCommunityIcons name="bird" size={20} color={OB_COLORS.primary} /></Text>
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
            style={({ pressed }) => [styles.enableButton, pressed && styles.buttonPressed]}
            onPress={handleEnableReminders}
          >
            <LinearGradient
              colors={["#5B8C5A", "#4A7A49"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.enableGradient}
            >
              <Ionicons name="notifications-outline" size={20} color="#ffffff" />
              <Text style={styles.enableButtonText}>Enable reminders</Text>
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 32 : 32,
    paddingBottom: 24,
  },
  confirmationContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, gap: 24 },
  confirmTextWrap: { alignItems: "center" },
  confirmationTitle: { fontSize: 28, fontWeight: "800", color: OB_COLORS.textDark, marginBottom: 8 },
  confirmationSubtitle: { fontSize: 16, color: OB_COLORS.textMuted, textAlign: "center" },

  mascotSection: { alignItems: "center", marginBottom: 20 },

  titleSection: { alignItems: "center", marginBottom: 28 },
  title: { fontSize: 24, fontWeight: "800", color: OB_COLORS.textDark, textAlign: "center", lineHeight: 32, letterSpacing: -0.3, marginBottom: 10 },
  subtitle: { fontSize: 15, color: OB_COLORS.textMuted, textAlign: "center" },

  previewCard: {
    backgroundColor: OB_COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
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

  buttonsContainer: { gap: 12 },
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
  skipButton: { alignItems: "center", paddingVertical: 14 },
  skipButtonText: { fontSize: 15, fontWeight: "600", color: OB_COLORS.textLight },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
