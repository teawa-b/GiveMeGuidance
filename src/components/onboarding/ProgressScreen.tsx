import React from "react";
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
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic } from "../../lib/haptics";

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
  return (
    <View style={styles.container}>
      <EtherealBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Celebration Header */}
          <View style={styles.celebrationSection}>
            <View style={styles.celebrationIcon}>
              <MaterialCommunityIcons name="party-popper" size={40} color="#f59e0b" />
            </View>
            <Text style={styles.celebrationTitle}>You're on Day {streakDays}!</Text>
            <Text style={styles.celebrationSubtitle}>
              Your journey with God has begun
            </Text>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#f0fdf4" }]}>
                <MaterialCommunityIcons name="fire" size={24} color="#66b083" />
              </View>
              <Text style={styles.statValue}>{streakDays}</Text>
              <Text style={styles.statLabel}>day streak</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#fef3c7" }]}>
                <Ionicons name="time-outline" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>{nextScheduledTime}</Text>
              <Text style={styles.statLabel}>next guidance</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#f3e8ff" }]}>
                <Ionicons name="bookmark" size={24} color="#9333ea" />
              </View>
              <Text style={styles.statValue}>{savedCount}</Text>
              <Text style={styles.statLabel}>saved</Text>
            </View>
          </View>

          {/* Checklist */}
          <View style={styles.checklistCard}>
            <Text style={styles.checklistTitle}>Getting started</Text>
            
            <View style={styles.checklistItem}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color="#66b083"
              />
              <Text style={styles.checklistText}>Complete today's step</Text>
            </View>

            <View style={styles.checklistItem}>
              <Ionicons
                name={reminderSet ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={reminderSet ? "#66b083" : "#d1d5db"}
              />
              <Text style={[styles.checklistText, !reminderSet && styles.checklistTextPending]}>
                Set daily reminder
              </Text>
            </View>

            <View style={styles.checklistItem}>
              <Ionicons
                name={journeySaved ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={journeySaved ? "#66b083" : "#d1d5db"}
              />
              <Text style={[styles.checklistText, !journeySaved && styles.checklistTextPending]}>
                Save your journey
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                mediumHaptic();
                onContinueToHome();
              }}
            >
              <Text style={styles.primaryButtonText}>Continue to home</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </Pressable>

            <View style={styles.secondaryActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  mediumHaptic();
                  onViewSavedGuidance();
                }}
              >
                <Ionicons name="bookmark-outline" size={18} color="#66b083" />
                <Text style={styles.secondaryButtonText}>View saved</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  mediumHaptic();
                  onExploreTopics();
                }}
              >
                <Ionicons name="compass-outline" size={18} color="#66b083" />
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 40 : 40,
    paddingBottom: 40,
  },
  celebrationSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  celebrationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
  checklistCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  checklistText: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "500",
  },
  checklistTextPending: {
    color: "#9ca3af",
  },
  actionsContainer: {
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
  secondaryActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f0fdf4",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dcfce7",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#66b083",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
