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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { GuidanceStyle, styleDisplayNames } from "../../lib/OnboardingContext";

interface StyleSelectionScreenProps {
  selectedStyle: GuidanceStyle;
  prayerPromptEnabled: boolean;
  onStyleSelect: (style: GuidanceStyle) => void;
  onPrayerToggle: (enabled: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const styleOptions: { value: GuidanceStyle; icon: string; description: string }[] = [
  {
    value: "gentle",
    icon: "heart-outline",
    description: "Warm, supportive, and encouraging tone",
  },
  {
    value: "direct",
    icon: "flash-outline",
    description: "Clear, focused, and actionable",
  },
  {
    value: "deep",
    icon: "book-outline",
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
            <Pressable style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#6b7280" />
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

          {/* Style Options */}
          <View style={styles.optionsContainer}>
            {styleOptions.map((option) => {
              const isSelected = selectedStyle === option.value;

              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    pressed && styles.optionCardPressed,
                  ]}
                  onPress={() => {
                    lightHaptic();
                    onStyleSelect(option.value);
                  }}
                >
                  <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                    <Ionicons
                      name={option.icon as any}
                      size={24}
                      color={isSelected ? "#66b083" : "#9ca3af"}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                      {styleDisplayNames[option.value]}
                    </Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Prayer Prompt Toggle */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleContent}>
              <View style={styles.toggleIcon}>
                <MaterialCommunityIcons name="hands-pray" size={20} color="#66b083" />
              </View>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Include a prayer prompt</Text>
                <Text style={styles.toggleDescription}>
                  A short prayer to start or end your time
                </Text>
              </View>
            </View>
            <Switch
              value={prayerPromptEnabled}
              onValueChange={(value) => {
                lightHaptic();
                onPrayerToggle(value);
              }}
              trackColor={{ false: "#e5e7eb", true: "#bbf7d0" }}
              thumbColor={prayerPromptEnabled ? "#66b083" : "#f4f4f5"}
              ios_backgroundColor="#e5e7eb"
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
  progressDotCompleted: {
    backgroundColor: "#66b083",
  },
  placeholder: {
    width: 44,
  },
  titleSection: {
    marginBottom: 32,
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
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f3f4f6",
    gap: 16,
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
  optionCardSelected: {
    backgroundColor: "#f0fdf4",
    borderColor: "#66b083",
  },
  optionCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerSelected: {
    backgroundColor: "#dcfce7",
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: "#1f2937",
  },
  optionDescription: {
    fontSize: 14,
    color: "#9ca3af",
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#66b083",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#66b083",
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
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
  toggleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 13,
    color: "#9ca3af",
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
