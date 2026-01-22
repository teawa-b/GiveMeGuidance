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
import { Ionicons } from "@expo/vector-icons";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { SpiritualGoal, goalDisplayNames } from "../../lib/OnboardingContext";

interface GoalSelectionScreenProps {
  selectedGoals: SpiritualGoal[];
  onGoalToggle: (goal: SpiritualGoal) => void;
  onContinue: () => void;
  onBack: () => void;
}

const goals: SpiritualGoal[] = [
  "prayer",
  "bible",
  "peace",
  "discipline",
  "healing",
  "purpose",
  "relationships",
  "gratitude",
];

const goalIcons: Record<SpiritualGoal, string> = {
  prayer: "hands-praying",
  bible: "book-open-variant",
  peace: "white-balance-sunny",
  discipline: "shield-check",
  healing: "heart-pulse",
  purpose: "compass",
  relationships: "account-group",
  gratitude: "hand-heart",
};

export function GoalSelectionScreen({
  selectedGoals,
  onGoalToggle,
  onContinue,
  onBack,
}: GoalSelectionScreenProps) {
  const canContinue = selectedGoals.length >= 1;

  return (
    <View style={styles.container}>
      <EtherealBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#6b7280" />
            </Pressable>
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressDot} />
              <View style={styles.progressDot} />
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>What do you want help with right now?</Text>
            <Text style={styles.subtitle}>Select 1 or 2 that resonate most</Text>
          </View>

          {/* Goals Grid */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.goalsGrid}
            showsVerticalScrollIndicator={false}
          >
            {goals.map((goal) => {
              const isSelected = selectedGoals.includes(goal);
              const isDisabled = !isSelected && selectedGoals.length >= 2;

              return (
                <Pressable
                  key={goal}
                  style={({ pressed }) => [
                    styles.goalChip,
                    isSelected && styles.goalChipSelected,
                    isDisabled && styles.goalChipDisabled,
                    pressed && !isDisabled && styles.goalChipPressed,
                  ]}
                  onPress={() => {
                    if (!isDisabled) {
                      lightHaptic();
                      onGoalToggle(goal);
                    }
                  }}
                  disabled={isDisabled}
                >
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={isSelected ? "#66b083" : isDisabled ? "#d1d5db" : "#9ca3af"}
                  />
                  <Text
                    style={[
                      styles.goalText,
                      isSelected && styles.goalTextSelected,
                      isDisabled && styles.goalTextDisabled,
                    ]}
                  >
                    {goalDisplayNames[goal]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Continue Button */}
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.continueButton,
                !canContinue && styles.continueButtonDisabled,
                pressed && canContinue && styles.buttonPressed,
              ]}
              onPress={() => {
                if (canContinue) {
                  mediumHaptic();
                  onContinue();
                }
              }}
              disabled={!canContinue}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  !canContinue && styles.continueButtonTextDisabled,
                ]}
              >
                Continue
              </Text>
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 12 : 12,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  progressContainer: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
  },
  progressDotActive: {
    backgroundColor: "#66b083",
    width: 24,
  },
  placeholder: {
    width: 44,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    lineHeight: 36,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  scrollView: {
    flex: 1,
  },
  goalsGrid: {
    gap: 12,
    paddingBottom: 16,
  },
  goalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f3f4f6",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  goalChipSelected: {
    backgroundColor: "#f0fdf4",
    borderColor: "#66b083",
  },
  goalChipDisabled: {
    opacity: 0.5,
  },
  goalChipPressed: {
    transform: [{ scale: 0.98 }],
  },
  goalText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4b5563",
    flex: 1,
  },
  goalTextSelected: {
    color: "#1f2937",
    fontWeight: "600",
  },
  goalTextDisabled: {
    color: "#9ca3af",
  },
  footer: {
    paddingTop: 16,
  },
  continueButton: {
    backgroundColor: "#66b083",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
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
  continueButtonDisabled: {
    backgroundColor: "#e5e7eb",
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
  continueButtonTextDisabled: {
    color: "#9ca3af",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
