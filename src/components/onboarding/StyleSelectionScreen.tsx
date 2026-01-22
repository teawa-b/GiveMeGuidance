import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Pressable,
  Switch,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { GuidanceStyle } from "../../lib/OnboardingContext";

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (width - 48 - CARD_GAP) / 2;

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
  prayerPromptEnabled: boolean;
  onStyleSelect: (style: GuidanceStyle) => void;
  onPrayerToggle: (enabled: boolean) => void;
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
  prayerPromptEnabled,
  onStyleSelect,
  onPrayerToggle,
  onContinue,
  onBack,
  isLoading,
}: StyleSelectionScreenProps) {
  return (
    <View style={styles.container}>
      <EtherealBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
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
            <View style={styles.topRow}>
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
                        size={24}
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

            {/* Second Row - Full width card */}
            {(() => {
              const option = styleOptions[2];
              const isSelected = selectedStyle === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.wideCard,
                    isSelected && styles.cardSelected,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => {
                    lightHaptic();
                    onStyleSelect(option.value);
                  }}
                >
                  {/* Icon */}
                  <View style={[styles.wideIconBox, isSelected && styles.iconBoxSelected]}>
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={isSelected ? COLORS.primary : COLORS.textLight}
                    />
                  </View>
                  
                  {/* Text */}
                  <View style={styles.wideCardContent}>
                    <Text style={[styles.wideCardTitle, isSelected && styles.cardTitleSelected]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.wideCardDescription, isSelected && styles.cardDescriptionSelected]}>
                      {option.description}
                    </Text>
                  </View>
                  
                  {/* Selection indicator */}
                  <View style={[styles.wideRadioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })()}
          </View>

          {/* Prayer Prompt Toggle */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleLeft}>
              <View style={styles.toggleIcon}>
                <MaterialCommunityIcons name="hands-pray" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Include a prayer prompt</Text>
                <Text style={styles.toggleDescription}>
                  Start or end with a short prayer
                </Text>
              </View>
            </View>
            <Switch
              value={prayerPromptEnabled}
              onValueChange={(value) => {
                lightHaptic();
                onPrayerToggle(value);
              }}
              trackColor={{ false: "#E5E7EB", true: "rgba(116, 159, 130, 0.4)" }}
              thumbColor={prayerPromptEnabled ? COLORS.primary : "#FFFFFF"}
              ios_backgroundColor="#E5E7EB"
            />
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
                  <MaterialCommunityIcons name="loading" size={20} color="#ffffff" />
                  <Text style={styles.continueButtonText}>Generating your guidance...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Generate today's guidance</Text>
                  <MaterialCommunityIcons name="creation" size={20} color="#ffffff" />
                </>
              )}
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
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  gridContainer: {
    gap: CARD_GAP,
    marginBottom: 20,
  },
  topRow: {
    flexDirection: "row",
    gap: CARD_GAP,
  },
  squareCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
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
  wideCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
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
  wideCardContent: {
    flex: 1,
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
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.iconBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  wideIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.iconBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  iconBoxSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 6,
    textAlign: "center",
  },
  wideCardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
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
  wideCardDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
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
  wideRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    marginLeft: 12,
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
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 16,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
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
