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
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic, successHaptic, lightHaptic } from "../../lib/haptics";

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
    
    // Hide reward after 2 seconds and proceed
    setTimeout(() => {
      setShowReward(false);
      onMarkDone();
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <EtherealBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <MaterialCommunityIcons name="white-balance-sunny" size={16} color="#66b083" />
              <Text style={styles.headerBadgeText}>TODAY'S WALK</Text>
            </View>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Verse Section */}
            <View style={styles.verseSection}>
              <Text style={styles.verseText}>"{data.verse}"</Text>
              <Text style={styles.verseReference}>{data.reference}</Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Reflection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb-outline" size={18} color="#66b083" />
                <Text style={styles.sectionTitle}>Reflection</Text>
              </View>
              <Text style={styles.reflectionText}>{data.reflection}</Text>
            </View>

            {/* Step for Today */}
            <View style={styles.stepSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="footsteps-outline" size={18} color="#66b083" />
                <Text style={styles.sectionTitle}>One step for today</Text>
              </View>
              <View style={[styles.stepCard, stepCompleted && styles.stepCardCompleted]}>
                <Text style={[styles.stepText, stepCompleted && styles.stepTextCompleted]}>
                  {data.step}
                </Text>
                {stepCompleted && (
                  <Ionicons name="checkmark-circle" size={24} color="#66b083" />
                )}
              </View>
            </View>

            {/* Prayer Prompt (optional) */}
            {showPrayerPrompt && data.prayerPrompt && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="hands-pray" size={18} color="#9333ea" />
                  <Text style={[styles.sectionTitle, { color: "#9333ea" }]}>Prayer</Text>
                </View>
                <Text style={styles.prayerText}>{data.prayerPrompt}</Text>
              </View>
            )}
          </View>

          {/* Reward Message */}
          {showReward && (
            <View style={styles.rewardContainer}>
              <View style={styles.rewardBadge}>
                <Ionicons name="sparkles" size={16} color="#f59e0b" />
                <Text style={styles.rewardText}>Nice. Showing up counts.</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {!stepCompleted ? (
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleMarkDone}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                <Text style={styles.primaryButtonText}>Mark step as done</Text>
              </Pressable>
            ) : (
              <View style={styles.completedButton}>
                <Ionicons name="checkmark-circle" size={20} color="#66b083" />
                <Text style={styles.completedButtonText}>Step completed!</Text>
              </View>
            )}

            {/* Secondary Actions */}
            {!stepCompleted && (
              <View style={styles.secondaryActions}>
                {onMakeShorter && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => {
                      lightHaptic();
                      onMakeShorter();
                    }}
                  >
                    <Ionicons name="contract-outline" size={18} color="#6b7280" />
                    <Text style={styles.secondaryButtonText}>Make it shorter</Text>
                  </Pressable>
                )}
                {onAnotherAngle && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => {
                      lightHaptic();
                      onAnotherAngle();
                    }}
                  >
                    <Ionicons name="refresh-outline" size={18} color="#6b7280" />
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
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 20 : 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#66b083",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  verseSection: {
    marginBottom: 20,
  },
  verseText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1f2937",
    lineHeight: 32,
    fontStyle: "italic",
    marginBottom: 12,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: "600",
    color: "#66b083",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#66b083",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reflectionText: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 26,
  },
  stepSection: {
    marginBottom: 24,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#dcfce7",
  },
  stepCardCompleted: {
    backgroundColor: "#dcfce7",
    borderColor: "#66b083",
  },
  stepText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1f2937",
    flex: 1,
    lineHeight: 22,
  },
  stepTextCompleted: {
    color: "#166534",
  },
  prayerText: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 24,
    fontStyle: "italic",
  },
  rewardContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
  },
  actionsContainer: {
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
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
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
  completedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#dcfce7",
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#66b083",
  },
  completedButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#166534",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f3f4f6",
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
