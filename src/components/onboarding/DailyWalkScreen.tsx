import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { mediumHaptic, successHaptic, lightHaptic } from "../../lib/haptics";
import { MascotBird } from "./MascotBird";
import { WarmBackground } from "./WarmBackground";
import { OB_COLORS, cardShadow, buttonShadow } from "./theme";
import { LinearGradient } from "expo-linear-gradient";

export interface DailyWalkData {
  verse: string;
  reference: string;
  reflection: string;
  step: string;
  prayerPrompt?: string;
}

interface DailyWalkScreenProps {
  data: DailyWalkData;
  onMarkDone: () => void;
  onMakeShorter?: () => void;
  onAnotherAngle?: () => void;
  showPrayerPrompt: boolean;
}

export function DailyWalkScreen({
  data,
  onMarkDone,
  onMakeShorter,
  onAnotherAngle,
  showPrayerPrompt,
}: DailyWalkScreenProps) {
  const [stepCompleted, setStepCompleted] = useState(false);
  const [showReward, setShowReward] = useState(false);

  const handleMarkDone = () => {
    successHaptic();
    setStepCompleted(true);
    setShowReward(true);
    setTimeout(() => {
      setShowReward(false);
      onMarkDone();
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <WarmBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header with bird */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerBadge}>
                <Ionicons name="sunny" size={14} color={OB_COLORS.gold} />
                <Text style={styles.headerBadgeText}>TODAY'S WALK</Text>
              </View>
              <MascotBird pose="reading" size="tiny" animate delay={200} bobAmount={3} />
            </View>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Verse */}
            <View style={styles.verseSection}>
              <Text style={styles.verseText}>"{data.verse}"</Text>
              <Text style={styles.verseReference}>{data.reference}</Text>
            </View>

            <View style={styles.divider} />

            {/* Reflection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb-outline" size={18} color={OB_COLORS.gold} />
                <Text style={styles.sectionTitle}>Reflection</Text>
              </View>
              <Text style={styles.reflectionText}>{data.reflection}</Text>
            </View>

            {/* Step */}
            <View style={styles.stepSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="shoe-print" size={18} color={OB_COLORS.primary} />
                <Text style={styles.sectionTitle}>One step for today</Text>
              </View>
              <View style={[styles.stepCard, stepCompleted && styles.stepCardCompleted]}>
                <Text style={[styles.stepText, stepCompleted && styles.stepTextCompleted]}>{data.step}</Text>
                {stepCompleted && <Ionicons name="checkmark-circle" size={24} color={OB_COLORS.primary} />}
              </View>
            </View>

            {/* Prayer */}
            {showPrayerPrompt && data.prayerPrompt && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="hands-pray" size={18} color="#7C3AED" />
                  <Text style={[styles.sectionTitle, { color: "#7C3AED" }]}>Prayer</Text>
                </View>
                <Text style={styles.prayerText}>{data.prayerPrompt}</Text>
              </View>
            )}
          </View>

          {/* Reward */}
          {showReward && (
            <View style={styles.rewardContainer}>
              <View style={styles.rewardBadge}>
                <Ionicons name="sparkles" size={16} color={OB_COLORS.gold} />
                <Text style={styles.rewardText}>Nice. Showing up counts.</Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {!stepCompleted ? (
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                onPress={handleMarkDone}
              >
                <LinearGradient
                  colors={["#5B8C5A", "#4A7A49"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryGradient}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                  <Text style={styles.primaryButtonText}>Mark step as done</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <View style={styles.completedButton}>
                <Ionicons name="checkmark-circle" size={20} color={OB_COLORS.primary} />
                <Text style={styles.completedButtonText}>Step completed!</Text>
              </View>
            )}

            {!stepCompleted && (
              <View style={styles.secondaryActions}>
                {onMakeShorter && (
                  <Pressable
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                    onPress={() => { lightHaptic(); onMakeShorter(); }}
                  >
                    <Ionicons name="contract-outline" size={18} color={OB_COLORS.textMuted} />
                    <Text style={styles.secondaryButtonText}>Make it shorter</Text>
                  </Pressable>
                )}
                {onAnotherAngle && (
                  <Pressable
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                    onPress={() => { lightHaptic(); onAnotherAngle(); }}
                  >
                    <Ionicons name="refresh-outline" size={18} color={OB_COLORS.textMuted} />
                    <Text style={styles.secondaryButtonText}>Another angle</Text>
                  </Pressable>
                )}
              </View>
            )}
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 16 : 16,
    paddingBottom: 40,
  },

  header: { marginBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: OB_COLORS.goldLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  headerBadgeText: { fontSize: 12, fontWeight: "800", color: OB_COLORS.gold, letterSpacing: 0.5 },

  card: {
    backgroundColor: OB_COLORS.surface, borderRadius: 24, padding: 24,
    ...cardShadow,
  },
  verseSection: { marginBottom: 20 },
  verseText: { fontSize: 20, fontWeight: "700", color: OB_COLORS.textDark, lineHeight: 30, fontStyle: "italic", marginBottom: 12 },
  verseReference: { fontSize: 14, fontWeight: "700", color: OB_COLORS.primary },
  divider: { height: 1, backgroundColor: OB_COLORS.border, marginVertical: 20 },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: OB_COLORS.primary, textTransform: "uppercase", letterSpacing: 0.5 },
  reflectionText: { fontSize: 16, color: OB_COLORS.textBody, lineHeight: 26 },

  stepSection: { marginBottom: 24 },
  stepCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: OB_COLORS.primaryLight, padding: 16, borderRadius: 18,
    borderWidth: 2, borderColor: "rgba(91, 140, 90, 0.2)",
  },
  stepCardCompleted: { backgroundColor: "#dcfce7", borderColor: OB_COLORS.primary },
  stepText: { fontSize: 15, color: OB_COLORS.textDark, lineHeight: 22, flex: 1, fontWeight: "500" },
  stepTextCompleted: { textDecorationLine: "line-through", color: OB_COLORS.textMuted },

  prayerText: { fontSize: 16, color: OB_COLORS.textBody, lineHeight: 26, fontStyle: "italic" },

  rewardContainer: { alignItems: "center", paddingVertical: 16 },
  rewardBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: OB_COLORS.goldLight, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
  },
  rewardText: { fontSize: 14, fontWeight: "700", color: OB_COLORS.gold },

  actionsContainer: { marginTop: 16, gap: 12 },
  primaryButton: {
    borderRadius: 999,
    overflow: "hidden",
    ...buttonShadow,
  },
  primaryGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 18, borderRadius: 999,
  },
  primaryButtonText: { fontSize: 17, fontWeight: "700", color: "#ffffff" },
  completedButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: OB_COLORS.primaryLight, paddingVertical: 18, borderRadius: 999,
    borderWidth: 2, borderColor: OB_COLORS.primary,
  },
  completedButtonText: { fontSize: 17, fontWeight: "700", color: OB_COLORS.primary },
  secondaryActions: { flexDirection: "row", gap: 12 },
  secondaryButton: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: OB_COLORS.surface, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: OB_COLORS.border,
  },
  secondaryButtonText: { fontSize: 13, fontWeight: "600", color: OB_COLORS.textMuted },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
