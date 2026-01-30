import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { SpiritualGoal } from "../../lib/OnboardingContext";

const CARD_GAP = 12;

// Colors
const COLORS = {
  primary: "#7BA07B",
  primaryLight: "rgba(123, 160, 123, 0.12)",
  primaryBorder: "rgba(123, 160, 123, 0.5)",
  surface: "#FFFFFF",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
  border: "#F3F4F6",
  disabled: "#E5E7EB",
};

interface GoalSelectionScreenProps {
  selectedGoals: SpiritualGoal[];
  onGoalToggle: (goal: SpiritualGoal) => void;
  onContinue: () => void;
  onBack: () => void;
}

// Updated goals with better labels matching the design
const goalData: { id: SpiritualGoal; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "prayer", label: "Build a daily prayer habit", icon: "time-outline" },
  { id: "bible", label: "Understand the Bible better", icon: "book-outline" },
  { id: "peace", label: "Find peace and reduce anxiety", icon: "leaf-outline" },
  { id: "discipline", label: "Beat temptation & grow discipline", icon: "shield-checkmark-outline" },
  { id: "healing", label: "Healing and forgiveness", icon: "heart-outline" },
  { id: "purpose", label: "Purpose and direction", icon: "compass-outline" },
];

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
        {/* Header */}
        <View style={styles.header}>
          <Pressable 
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.7 }
            ]} 
            onPress={onBack}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textMuted} />
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
        <View style={styles.goalsGrid}>
          <View style={styles.gridRow}>
            {goalData.slice(0, 2).map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isSelected={selectedGoals.includes(goal.id)}
                isDisabled={!selectedGoals.includes(goal.id) && selectedGoals.length >= 2}
                onPress={() => {
                  if (!(selectedGoals.length >= 2 && !selectedGoals.includes(goal.id))) {
                    lightHaptic();
                    onGoalToggle(goal.id);
                  }
                }}
              />
            ))}
          </View>
          <View style={styles.gridRow}>
            {goalData.slice(2, 4).map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isSelected={selectedGoals.includes(goal.id)}
                isDisabled={!selectedGoals.includes(goal.id) && selectedGoals.length >= 2}
                onPress={() => {
                  if (!(selectedGoals.length >= 2 && !selectedGoals.includes(goal.id))) {
                    lightHaptic();
                    onGoalToggle(goal.id);
                  }
                }}
              />
            ))}
          </View>
          <View style={styles.gridRow}>
            {goalData.slice(4, 6).map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isSelected={selectedGoals.includes(goal.id)}
                isDisabled={!selectedGoals.includes(goal.id) && selectedGoals.length >= 2}
                onPress={() => {
                  if (!(selectedGoals.length >= 2 && !selectedGoals.includes(goal.id))) {
                    lightHaptic();
                    onGoalToggle(goal.id);
                  }
                }}
              />
            ))}
          </View>
        </View>

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
      </SafeAreaView>
    </View>
  );
}

// Goal Card Component
function GoalCard({
  goal,
  isSelected,
  isDisabled,
  onPress,
}: {
  goal: { id: SpiritualGoal; label: string; icon: keyof typeof Ionicons.glyphMap };
  isSelected: boolean;
  isDisabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.goalCard,
        isSelected && styles.goalCardSelected,
        isDisabled && styles.goalCardDisabled,
        pressed && !isDisabled && styles.goalCardPressed,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      <View
        style={[
          styles.iconContainer,
          isSelected && styles.iconContainerSelected,
        ]}
      >
        <Ionicons
          name={goal.icon}
          size={20}
          color={isSelected ? "#FFFFFF" : COLORS.primary}
        />
      </View>
      <Text
        style={[
          styles.goalLabel,
          isSelected && styles.goalLabelSelected,
          isDisabled && styles.goalLabelDisabled,
        ]}
      >
        {goal.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F7F4",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 16 : 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Platform.OS === "ios" ? 12 : 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
    height: 6,
    borderRadius: 3,
  },
  placeholder: {
    width: 40,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textDark,
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  goalsGrid: {
    paddingTop: 4,
    paddingBottom: 12,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  goalCard: {
    width: 135,
    height: 125,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 4px 12px rgba(123, 160, 123, 0.08)",
      },
    }),
  },
  goalCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#F0FDF4",
  },
  goalCardDisabled: {
    opacity: 0.5,
  },
  goalCardPressed: {
    transform: [{ scale: 0.97 }],
    borderColor: COLORS.primaryBorder,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconContainerSelected: {
    backgroundColor: COLORS.primary,
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textDark,
    textAlign: "center",
    lineHeight: 16,
  },
  goalLabelSelected: {
    color: COLORS.textDark,
  },
  goalLabelDisabled: {
    color: COLORS.textLight,
  },
  footer: {
    paddingTop: 24,
    paddingHorizontal: 32,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 999,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  continueButtonTextDisabled: {
    color: COLORS.textLight,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
