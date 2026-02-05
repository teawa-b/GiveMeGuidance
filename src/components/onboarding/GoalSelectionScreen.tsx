import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BookOpen,
  Compass,
  HandHeart,
  HeartPulse,
  ShieldCheck,
  Sunrise,
  type LucideIcon,
} from "lucide-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { SpiritualGoal } from "../../lib/OnboardingContext";
import { MascotBird } from "./MascotBird";
import { WarmBackground } from "./WarmBackground";
import { OB_COLORS, cardShadow, buttonShadow } from "./theme";
import { LinearGradient } from "expo-linear-gradient";

interface GoalSelectionScreenProps {
  selectedGoals: SpiritualGoal[];
  onGoalToggle: (goal: SpiritualGoal) => void;
  onContinue: () => void;
  onBack: () => void;
}

const goalData: { id: SpiritualGoal; label: string; icon: LucideIcon; color: string }[] = [
  { id: "prayer", label: "Build a daily prayer habit", icon: HandHeart, color: "#D4A843" },
  { id: "bible", label: "Understand the Bible better", icon: BookOpen, color: "#5B8C5A" },
  { id: "peace", label: "Find peace and reduce anxiety", icon: Sunrise, color: "#6BA3BE" },
  { id: "discipline", label: "Beat temptation & grow discipline", icon: ShieldCheck, color: "#8B6BAE" },
  { id: "healing", label: "Healing and forgiveness", icon: HeartPulse, color: "#D4756A" },
  { id: "purpose", label: "Purpose and direction", icon: Compass, color: "#7C6B4F" },
];

export function GoalSelectionScreen({
  selectedGoals,
  onGoalToggle,
  onContinue,
  onBack,
}: GoalSelectionScreenProps) {
  const canContinue = selectedGoals.length >= 1;
  const insets = useSafeAreaInsets();

  const isWeb = Platform.OS === "web";
  const cardAnims = useRef(goalData.map(() => new Animated.Value(isWeb ? 1 : 0))).current;
  const cardSlides = useRef(goalData.map(() => new Animated.Value(isWeb ? 0 : 30))).current;

  useEffect(() => {
    if (isWeb) return;
    const staggered = goalData.map((_, i) =>
      Animated.parallel([
        Animated.timing(cardAnims[i], { toValue: 1, duration: 400, delay: 400 + i * 80, useNativeDriver: true }),
        Animated.spring(cardSlides[i], { toValue: 0, tension: 60, friction: 8, delay: 400 + i * 80, useNativeDriver: true }),
      ])
    );
    Animated.parallel(staggered).start();
  }, []);

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
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
            onPress={onBack}
          >
            <Ionicons name="arrow-back" size={22} color={OB_COLORS.textMuted} />
          </Pressable>
          <ProgressSteps current={0} />
          <View style={styles.placeholder} />
        </View>

        <View style={styles.mascotRow}>
          <MascotBird pose="pointing-up" size="small" animate delay={100} style={{ marginRight: -12 }} />
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>What's on your heart?</Text>
            <View style={styles.speechTail} />
          </View>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>What do you want{"\n"}help with right now?</Text>
          <Text style={styles.subtitle}>Select 1 or 2 that resonate most</Text>
        </View>

        <View style={styles.goalsGrid}>
          <View style={styles.gridRow}>
            {goalData.slice(0, 2).map((goal, i) => (
              <AnimatedGoalCard
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
                animOpacity={cardAnims[i]}
                animSlide={cardSlides[i]}
              />
            ))}
          </View>
          <View style={styles.gridRow}>
            {goalData.slice(2, 4).map((goal, i) => (
              <AnimatedGoalCard
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
                animOpacity={cardAnims[i + 2]}
                animSlide={cardSlides[i + 2]}
              />
            ))}
          </View>
          <View style={styles.gridRow}>
            {goalData.slice(4, 6).map((goal, i) => (
              <AnimatedGoalCard
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
                animOpacity={cardAnims[i + 4]}
                animSlide={cardSlides[i + 4]}
              />
            ))}
          </View>
        </View>

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
            {canContinue ? (
              <LinearGradient
                colors={["#5B8C5A", "#4A7A49"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.continueGradient}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <View style={styles.continueGradient}>
                <Text style={styles.continueButtonTextDisabled}>Continue</Text>
              </View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ProgressSteps({ current }: { current: number }) {
  return (
    <View style={styles.progressContainer}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            i === current && styles.progressDotActive,
            i < current && styles.progressDotCompleted,
          ]}
        />
      ))}
    </View>
  );
}

function AnimatedGoalCard({
  goal,
  isSelected,
  isDisabled,
  onPress,
  animOpacity,
  animSlide,
}: {
  goal: (typeof goalData)[0];
  isSelected: boolean;
  isDisabled: boolean;
  onPress: () => void;
  animOpacity: Animated.Value;
  animSlide: Animated.Value;
}) {
  const Icon = goal.icon;

  return (
    <Animated.View style={{ opacity: animOpacity, transform: [{ translateY: animSlide }] }}>
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
        <View style={[styles.goalIconWrap, { backgroundColor: `${goal.color}15` }]}> 
          <Icon
            size={24}
            color={isSelected ? OB_COLORS.primaryDark : goal.color}
            strokeWidth={2.25}
          />
        </View>
        <Text style={[styles.goalLabel, isSelected && styles.goalLabelSelected, isDisabled && styles.goalLabelDisabled]}>
          {goal.label}
        </Text>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OB_COLORS.cream },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: OB_COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: OB_COLORS.disabled },
  progressDotActive: { width: 28, borderRadius: 4, backgroundColor: OB_COLORS.primary },
  progressDotCompleted: { backgroundColor: OB_COLORS.primary },
  placeholder: { width: 42 },

  mascotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  speechBubble: {
    backgroundColor: OB_COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: OB_COLORS.primaryLight,
    position: "relative",
    ...Platform.select({
      ios: { shadowColor: OB_COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  speechText: { fontSize: 13, fontWeight: "600", color: OB_COLORS.primary },
  speechTail: {
    position: "absolute",
    left: -6,
    top: "50%",
    marginTop: -4,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderRightWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderRightColor: OB_COLORS.primaryLight,
  },

  titleSection: { alignItems: "center", marginBottom: 12, paddingHorizontal: 16 },
  title: {
    fontSize: 23,
    fontWeight: "800",
    color: OB_COLORS.textDark,
    textAlign: "center",
    lineHeight: 30,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: OB_COLORS.textMuted, textAlign: "center" },

  goalsGrid: { paddingTop: 4, paddingBottom: 8 },
  gridRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 12 },

  goalCard: {
    width: 140,
    height: 120,
    backgroundColor: OB_COLORS.surface,
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    ...cardShadow,
  },
  goalCardSelected: {
    borderColor: OB_COLORS.primary,
    backgroundColor: OB_COLORS.primaryLight,
  },
  goalCardDisabled: { opacity: 0.4 },
  goalCardPressed: { transform: [{ scale: 0.96 }] },
  goalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: OB_COLORS.textDark,
    textAlign: "center",
    lineHeight: 16,
  },
  goalLabelSelected: { color: OB_COLORS.primaryDark },
  goalLabelDisabled: { color: OB_COLORS.textLight },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: OB_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  footer: { paddingTop: 10, paddingHorizontal: 24 },
  continueButton: {
    borderRadius: 18,
    overflow: "hidden",
    ...buttonShadow,
  },
  continueGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 18,
  },
  continueButtonDisabled: {
    backgroundColor: OB_COLORS.disabled,
    ...Platform.select({ ios: { shadowOpacity: 0 }, android: { elevation: 0 } }),
  },
  continueButtonText: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  continueButtonTextDisabled: { color: OB_COLORS.textLight, fontSize: 17, fontWeight: "700" },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
