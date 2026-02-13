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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { GuidanceStyle } from "../../lib/OnboardingContext";
import { MascotBird } from "./MascotBird";
import { WarmBackground } from "./WarmBackground";
import { OB_COLORS, cardShadow, buttonShadow, softShadow } from "./theme";
import { LinearGradient } from "expo-linear-gradient";

const CARD_GAP = 12;

interface StyleSelectionScreenProps {
  selectedStyle: GuidanceStyle;
  onStyleSelect: (style: GuidanceStyle) => void;
  onContinue: () => void;
  onBack: () => void;
}

const styleOptions: {
  value: GuidanceStyle;
  icon: string;
  color: string;
  title: string;
  description: string;
}[] = [
  { value: "gentle", icon: "heart-outline", color: "#D4A843", title: "Gentle", description: "Warm, supportive, and encouraging tone" },
  { value: "direct", icon: "flash-outline", color: "#E8963E", title: "Direct", description: "Clear, focused, and actionable" },
  { value: "deep", icon: "library-outline", color: "#5B8C5A", title: "Bible Deep Dive", description: "Rich context and scripture study" },
];

export function StyleSelectionScreen({
  selectedStyle,
  onStyleSelect,
  onContinue,
  onBack,
}: StyleSelectionScreenProps) {
  const insets = useSafeAreaInsets();

  const isWeb = Platform.OS === "web";
  const cardAnims = useRef(styleOptions.map(() => new Animated.Value(isWeb ? 1 : 0))).current;
  const cardSlides = useRef(styleOptions.map(() => new Animated.Value(isWeb ? 0 : 24))).current;

  useEffect(() => {
    if (isWeb) return;
    styleOptions.forEach((_, i) => {
      Animated.parallel([
        Animated.timing(cardAnims[i], { toValue: 1, duration: 400, delay: 400 + i * 100, useNativeDriver: true }),
        Animated.spring(cardSlides[i], { toValue: 0, tension: 60, friction: 9, delay: 400 + i * 100, useNativeDriver: true }),
      ]).start();
    });
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
          <Pressable style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color={OB_COLORS.textMuted} />
          </Pressable>
          <ProgressSteps current={2} />
          <View style={styles.spacerSlot} />
        </View>

        <View style={styles.mascotRow}>
          <MascotBird pose="pointing-up" size="small" animate delay={100} />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>How should it feel?</Text>
          <Text style={styles.subtitle}>Choose the style that resonates with you</Text>
        </View>

        <View style={styles.gridContainer}>
          <View style={styles.cardRow}>
            {styleOptions.slice(0, 2).map((option, i) => {
              const isSelected = selectedStyle === option.value;
              return (
                <Animated.View key={option.value} style={[styles.cardWrapper, { opacity: cardAnims[i], transform: [{ translateY: cardSlides[i] }] }]}>
                  <Pressable
                    style={({ pressed }) => [styles.squareCard, isSelected && styles.cardSelected, pressed && styles.cardPressed]}
                    onPress={() => {
                      lightHaptic();
                      onStyleSelect(option.value);
                    }}
                  >
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={[styles.cardIconWrap, { backgroundColor: `${option.color}15` }]}>
                      <Ionicons name={option.icon as any} size={28} color={isSelected ? OB_COLORS.primaryDark : option.color} />
                    </View>
                    <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>{option.title}</Text>
                    <Text style={[styles.cardDescription, isSelected && styles.cardDescriptionSelected]}>{option.description}</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          <View style={styles.cardRow}>
            {(() => {
              const option = styleOptions[2];
              const isSelected = selectedStyle === option.value;
              return (
                <Animated.View key={option.value} style={[styles.cardWrapper, { opacity: cardAnims[2], transform: [{ translateY: cardSlides[2] }] }]}>
                  <Pressable
                    style={({ pressed }) => [styles.squareCard, isSelected && styles.cardSelected, pressed && styles.cardPressed]}
                    onPress={() => {
                      lightHaptic();
                      onStyleSelect(option.value);
                    }}
                  >
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={[styles.cardIconWrap, { backgroundColor: `${option.color}15` }]}>
                      <Ionicons name={option.icon as any} size={28} color={isSelected ? OB_COLORS.primaryDark : option.color} />
                    </View>
                    <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>{option.title}</Text>
                    <Text style={[styles.cardDescription, isSelected && styles.cardDescriptionSelected]}>{option.description}</Text>
                  </Pressable>
                </Animated.View>
              );
            })()}
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.continueButton, pressed && styles.buttonPressed]}
            onPress={() => {
              mediumHaptic();
              onContinue();
            }}
          >
            <LinearGradient
              colors={["#5B8C5A", "#4A7A49"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueGradient}
            >
              <Text style={styles.continueButtonText}>Generate today's guidance</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </LinearGradient>
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
        <View key={i} style={[styles.progressDot, i === current && styles.progressDotActive, i < current && styles.progressDotCompleted]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OB_COLORS.cream },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: OB_COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    ...softShadow,
  },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: OB_COLORS.disabled },
  progressDotActive: { width: 28, borderRadius: 4, backgroundColor: OB_COLORS.primary },
  progressDotCompleted: { backgroundColor: OB_COLORS.primary },
  spacerSlot: { width: 42 },

  mascotRow: { alignItems: "center", marginBottom: 2 },

  titleSection: { alignItems: "center", marginBottom: 14, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: "800", color: OB_COLORS.textDark, textAlign: "center", lineHeight: 30, letterSpacing: -0.4, marginBottom: 6 },
  subtitle: { fontSize: 14, color: OB_COLORS.textMuted, textAlign: "center" },

  gridContainer: { gap: CARD_GAP, marginBottom: 12, paddingHorizontal: 12 },
  cardRow: { flexDirection: "row", gap: CARD_GAP, justifyContent: "center" },
  cardWrapper: { flex: 1, maxWidth: 180 },

  squareCard: {
    minHeight: 160,
    backgroundColor: OB_COLORS.surface,
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    ...cardShadow,
  },
  cardSelected: { backgroundColor: OB_COLORS.primaryLight, borderColor: OB_COLORS.primary },
  cardPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: OB_COLORS.textDark, marginBottom: 6, textAlign: "center" },
  cardTitleSelected: { color: OB_COLORS.primaryDark },
  cardDescription: { fontSize: 12, color: OB_COLORS.textMuted, textAlign: "center", lineHeight: 17 },
  cardDescriptionSelected: { color: OB_COLORS.textBody },

  radioOuter: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: OB_COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: OB_COLORS.surface,
  },
  radioOuterSelected: { borderColor: OB_COLORS.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: OB_COLORS.primary },

  footer: { paddingTop: 12, paddingHorizontal: 20 },
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
    paddingHorizontal: 32,
    borderRadius: 18,
  },
  continueButtonText: { fontSize: 17, fontWeight: "700", color: "#ffffff" },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});

