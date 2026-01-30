import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { GuidanceStyle } from "../../lib/OnboardingContext";

const CARD_GAP = 12;

// Colors
const COLORS = {
  primary: "#749F82",
  primaryDark: "#5C8268",
  primaryLight: "rgba(116, 159, 130, 0.12)",
  surface: "#FFFFFF",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  textLight: "#9CA3B8",
  border: "#E5E7EB",
  iconBg: "#F3F4F6",
};

interface StyleSelectionScreenProps {
  selectedStyle: GuidanceStyle;
  onStyleSelect: (style: GuidanceStyle) => void;
  onContinue: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const styleOptions: { 
  value: GuidanceStyle; 
  icon: string; 
  title: string;
  description: string;
}[] = [
  {
    value: "gentle",
    icon: "heart",
    title: "Gentle",
    description: "Warm, supportive, and encouraging tone",
  },
  {
    value: "direct",
    icon: "flash",
    title: "Direct",
    description: "Clear, focused, and actionable",
  },
  {
    value: "deep",
    icon: "book",
    title: "Bible Deep Dive",
    description: "Rich context and scripture study",
  },
];

export function StyleSelectionScreen({
  selectedStyle,
  onStyleSelect,
  onContinue,
  onBack,
  isLoading,
}: StyleSelectionScreenProps) {
  return (
    <View style={styles.container}>
      <EtherealBackground />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
            <Pressable 
              style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]} 
              onPress={onBack}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.textMuted} />
            </Pressable>
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, styles.progressDotCompleted]} />
              <View style={[styles.progressDot, styles.progressDotCompleted]} />
              <View style={[styles.progressDot, styles.progressDotActive]} />
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>How should it feel?</Text>
            <Text style={styles.subtitle}>
              Choose the style that resonates with you
            </Text>
          </View>

          {/* Style Options - Grid Layout */}
          <View style={styles.gridContainer}>
            {/* First Row - Two square cards */}
            <View style={styles.cardRow}>
              {styleOptions.slice(0, 2).map((option) => {
                const isSelected = selectedStyle === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.squareCard,
                      isSelected && styles.cardSelected,
                      pressed && styles.cardPressed,
                    ]}
                    onPress={() => {
                      lightHaptic();
                      onStyleSelect(option.value);
                    }}
                  >
                    {/* Selection indicator */}
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    
                    {/* Icon */}
                    <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                      <Ionicons
                        name={option.icon as any}
                        size={22}
                        color={isSelected ? COLORS.primary : COLORS.textLight}
                      />
                    </View>
                    
                    {/* Text */}
                    <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.cardDescription, isSelected && styles.cardDescriptionSelected]}>
                      {option.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Second Row - Bible Deep Dive as square card */}
            <View style={styles.cardRow}>
              {(() => {
                const option = styleOptions[2];
                const isSelected = selectedStyle === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={({ pressed }) => [
                      styles.squareCard,
                      isSelected && styles.cardSelected,
                      pressed && styles.cardPressed,
                    ]}
                    onPress={() => {
                      lightHaptic();
                      onStyleSelect(option.value);
                    }}
                  >
                    {/* Selection indicator */}
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    
                    {/* Icon */}
                    <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                      <Ionicons
                        name={option.icon as any}
                        size={22}
                        color={isSelected ? COLORS.primary : COLORS.textLight}
                      />
                    </View>
                    
                    {/* Text */}
                    <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.cardDescription, isSelected && styles.cardDescriptionSelected]}>
                      {option.description}
                    </Text>
                  </Pressable>
                );
              })()}
            </View>
          </View>

          {/* Continue Button */}
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.continueButton,
                pressed && styles.buttonPressed,
                isLoading && styles.continueButtonLoading,
              ]}
              onPress={() => {
                mediumHaptic();
                onContinue();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.continueButtonText}>Generating...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Generate today's guidance</Text>
                  <Ionicons name="sparkles" size={18} color="#ffffff" />
                </>
              )}
            </Pressable>
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(116, 159, 130, 0.3)",
  },
  progressDotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  progressDotCompleted: {
    backgroundColor: COLORS.primary,
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
  gridContainer: {
    gap: CARD_GAP,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  cardRow: {
    flexDirection: "row",
    gap: CARD_GAP,
    justifyContent: "center",
  },
  squareCard: {
    flex: 1,
    maxWidth: 180,
    minHeight: 160,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.iconBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  iconBoxSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 6,
    textAlign: "center",
  },
  cardTitleSelected: {
    color: COLORS.textDark,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  cardDescriptionSelected: {
    color: COLORS.textMuted,
  },
  radioOuter: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
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
  continueButtonLoading: {
    opacity: 0.8,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
