import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Pressable,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { mediumHaptic } from "../../lib/haptics";
import { MascotBird } from "./MascotBird";
import { WarmBackground } from "./WarmBackground";
import { OB_COLORS, cardShadow, buttonShadow, softShadow } from "./theme";
import { LinearGradient } from "expo-linear-gradient";

interface ProgressScreenProps {
  streakDays: number;
  nextScheduledTime: string;
  savedCount: number;
  reminderSet: boolean;
  journeySaved: boolean;
  onViewSavedGuidance: () => void;
  onExploreTopics: () => void;
  onContinueToHome: () => void;
}

export function ProgressScreen({
  streakDays,
  nextScheduledTime,
  savedCount,
  reminderSet,
  journeySaved,
  onViewSavedGuidance,
  onExploreTopics,
  onContinueToHome,
}: ProgressScreenProps) {
  // Confetti-style sparkles
  const isWeb = Platform.OS === "web";
  const sparkleAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(isWeb ? 0.7 : 0))).current;

  useEffect(() => {
    if (isWeb) return;
    sparkleAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 400),
          Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  const sparklePositions = [
    { top: 8, left: "15%" },
    { top: 20, right: "12%" },
    { top: 50, left: "8%" },
    { top: 35, right: "20%" },
    { top: 60, left: "45%" },
  ];

  return (
    <View style={styles.container}>
      <WarmBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Celebration Header */}
          <View style={styles.celebrationSection}>
            {/* Sparkles */}
            {sparklePositions.map((pos, i) => (
              <Animated.View
                key={i}
                style={[styles.sparkleWrap, pos as any, { opacity: sparkleAnims[i] }]}
              >
                {i % 2 === 0 ? (
                  <Ionicons name="sparkles" size={16} color={OB_COLORS.gold} />
                ) : (
                  <MaterialCommunityIcons name="star-four-points" size={14} color={OB_COLORS.gold} />
                )}
              </Animated.View>
            ))}
            <MascotBird pose="reading" size="large" animate delay={100} />
            <Text style={styles.celebrationTitle}>You’re on Day {streakDays}! <MaterialCommunityIcons name="party-popper" size={24} color={OB_COLORS.gold} /></Text>
            <Text style={styles.celebrationSubtitle}>Your journey with God has begun</Text>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: "#E8963E15" }]}>
                <Ionicons name="flame-outline" size={22} color="#E8963E" />
              </View>
              <Text style={styles.statValue}>{streakDays}</Text>
              <Text style={styles.statLabel}>day streak</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: "#6B7DB315" }]}>
                <Ionicons name="alarm-outline" size={22} color="#6B7DB3" />
              </View>
              <Text style={styles.statValueSmall}>{nextScheduledTime}</Text>
              <Text style={styles.statLabel}>next guidance</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: "#5B8C5A15" }]}>
                <Ionicons name="bookmark-outline" size={22} color="#5B8C5A" />
              </View>
              <Text style={styles.statValue}>{savedCount}</Text>
              <Text style={styles.statLabel}>saved</Text>
            </View>
          </View>

          {/* Checklist */}
          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>Getting started</Text>

            <View style={styles.checklistItem}>
              <Ionicons name="checkmark-circle" size={24} color={OB_COLORS.primary} />
              <Text style={styles.checklistText}>Complete today's step</Text>
            </View>
            <View style={styles.checklistItem}>
              <Ionicons
                name={reminderSet ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={reminderSet ? OB_COLORS.primary : OB_COLORS.disabled}
              />
              <Text style={[styles.checklistText, !reminderSet && styles.checklistTextPending]}>
                Set daily reminder
              </Text>
            </View>
            <View style={styles.checklistItem}>
              <Ionicons
                name={journeySaved ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={journeySaved ? OB_COLORS.primary : OB_COLORS.disabled}
              />
              <Text style={[styles.checklistText, !journeySaved && styles.checklistTextPending]}>
                Save your journey
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => { mediumHaptic(); onContinueToHome(); }}
            >
              <LinearGradient
                colors={["#5B8C5A", "#4A7A49"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryButtonText}>Continue to home</Text>
                <View style={styles.arrowCircle}>
                  <Ionicons name="arrow-forward" size={16} color={OB_COLORS.primary} />
                </View>
              </LinearGradient>
            </Pressable>

            <View style={styles.secondaryActions}>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                onPress={() => { mediumHaptic(); onViewSavedGuidance(); }}
              >
                <Ionicons name="bookmark-outline" size={18} color={OB_COLORS.primary} />
                <Text style={styles.secondaryButtonText}>View saved</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                onPress={() => { mediumHaptic(); onExploreTopics(); }}
              >
                <Ionicons name="compass-outline" size={18} color={OB_COLORS.primary} />
                <Text style={styles.secondaryButtonText}>Explore topics</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OB_COLORS.cream },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 28 : 28,
    paddingBottom: 40,
  },

  celebrationSection: { alignItems: "center", marginBottom: 28, position: "relative" },
  sparkleWrap: { position: "absolute" },
  celebrationTitle: { fontSize: 28, fontWeight: "800", color: OB_COLORS.textDark, marginTop: 12, marginBottom: 6, letterSpacing: -0.3 },
  celebrationSubtitle: { fontSize: 15, color: OB_COLORS.textMuted },

  statsContainer: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: OB_COLORS.surface, borderRadius: 18, padding: 14, alignItems: "center",
    ...cardShadow,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: OB_COLORS.textDark, marginBottom: 4 },
  statValueSmall: { fontSize: 14, fontWeight: "700", color: OB_COLORS.textDark, marginBottom: 4, textAlign: "center" },
  statLabel: { fontSize: 11, color: OB_COLORS.textLight, fontWeight: "600", textAlign: "center" },

  checklistCard: {
    backgroundColor: OB_COLORS.surface, borderRadius: 22, padding: 20, marginBottom: 24,
    ...cardShadow,
  },
  checklistTitle: { fontSize: 16, fontWeight: "700", color: OB_COLORS.textDark, marginBottom: 16 },
  checklistItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  checklistText: { fontSize: 15, color: OB_COLORS.textDark, fontWeight: "600" },
  checklistTextPending: { color: OB_COLORS.textLight },

  actionsContainer: { gap: 12 },
  primaryButton: {
    borderRadius: 999,
    overflow: "hidden",
    ...buttonShadow,
  },
  primaryGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
    paddingVertical: 18, borderRadius: 999,
  },
  arrowCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center", justifyContent: "center",
  },
  primaryButtonText: { fontSize: 17, fontWeight: "700", color: "#ffffff" },
  secondaryActions: { flexDirection: "row", gap: 12 },
  secondaryButton: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: OB_COLORS.primaryLight, paddingVertical: 14, borderRadius: 16,
    borderWidth: 1.5, borderColor: "rgba(91, 140, 90, 0.2)",
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "700", color: OB_COLORS.primary },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
