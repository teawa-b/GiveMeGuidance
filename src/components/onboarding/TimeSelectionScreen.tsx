import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { TimeOfDay } from "../../lib/OnboardingContext";

// Colors
const COLORS = {
  primary: "#749F82",
  primaryDark: "#5C8268",
  primaryLight: "rgba(116, 159, 130, 0.1)",
  surface: "#FFFFFF",
  textDark: "#1F2937",
  textMuted: "#64748B",
  textLight: "#94A3B8",
  border: "#E2E8F0",
};

interface TimeSelectionScreenProps {
  selectedTime: TimeOfDay;
  customTime?: string;
  onTimeSelect: (time: TimeOfDay, customTime?: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

const timeData: { id: TimeOfDay; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "morning", label: "Morning", description: "6 AM – 12 PM", icon: "sunny-outline" },
  { id: "afternoon", label: "Afternoon", description: "12 PM – 5 PM", icon: "partly-sunny-outline" },
  { id: "evening", label: "Evening", description: "5 PM – 10 PM", icon: "moon-outline" },
];

// Generate time options for custom picker
const generateTimeOptions = () => {
  const times: { label: string; value: string }[] = [];
  for (let hour = 5; hour <= 22; hour++) {
    for (let minute of [0, 30]) {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      const timeValue = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const label = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
      times.push({ label, value: timeValue });
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

export function TimeSelectionScreen({
  selectedTime,
  customTime,
  onTimeSelect,
  onContinue,
  onBack,
}: TimeSelectionScreenProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Suggest time based on current hour
  useEffect(() => {
    const hour = new Date().getHours();
    if (!selectedTime || selectedTime === "custom") {
      if (hour < 12) {
        onTimeSelect("morning");
      } else if (hour < 17) {
        onTimeSelect("afternoon");
      } else {
        onTimeSelect("evening");
      }
    }
  }, []);

  const handleTimeSelect = (time: TimeOfDay) => {
    lightHaptic();
    onTimeSelect(time);
  };

  const handleCustomTimeSelect = (timeValue: string) => {
    lightHaptic();
    onTimeSelect("custom", timeValue);
    setShowTimePicker(false);
  };

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
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>When do you want your guidance?</Text>
          <Text style={styles.subtitle}>
            Choose the perfect moment for your daily connection
          </Text>
        </View>

        {/* Time Options - Simple Cards */}
        <View style={styles.timeCardsContainer}>
          {timeData.map((time) => {
            const isSelected = selectedTime === time.id;
            return (
              <Pressable
                key={time.id}
                style={({ pressed }) => [
                  styles.timeCard,
                  isSelected && styles.timeCardSelected,
                  pressed && styles.timeCardPressed,
                ]}
                onPress={() => handleTimeSelect(time.id)}
              >
                <View style={[styles.timeIconContainer, isSelected && styles.timeIconContainerSelected]}>
                  <Ionicons
                    name={time.icon}
                    size={24}
                    color={isSelected ? "#FFFFFF" : COLORS.primary}
                  />
                </View>
                <View style={styles.timeCardContent}>
                  <Text style={[styles.timeCardLabel, isSelected && styles.timeCardLabelSelected]}>
                    {time.label}
                  </Text>
                  <Text style={styles.timeCardDescription}>{time.description}</Text>
                </View>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Custom time link */}
        <Pressable
          style={({ pressed }) => [
            styles.customTimeButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => {
            lightHaptic();
            setShowTimePicker(true);
          }}
        >
          <Ionicons name="time-outline" size={18} color={COLORS.primary} />
          <Text style={styles.customTimeText}>Pick a specific time instead</Text>
        </Pressable>

        {/* Custom Time Picker Modal */}
        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose a time</Text>
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textMuted} />
                </Pressable>
              </View>
              <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
                {TIME_OPTIONS.map((time) => (
                  <Pressable
                    key={time.value}
                    style={({ pressed }) => [
                      styles.timeOption,
                      customTime === time.value && styles.timeOptionSelected,
                      pressed && styles.timeOptionPressed,
                    ]}
                    onPress={() => handleCustomTimeSelect(time.value)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        customTime === time.value && styles.timeOptionTextSelected,
                      ]}
                    >
                      {time.label}
                    </Text>
                    {customTime === time.value && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Continue Button */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              mediumHaptic();
              onContinue();
            }}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F9F6",
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
    backgroundColor: "rgba(116, 159, 130, 0.3)",
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
  timeCardsContainer: {
    gap: 14,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: "transparent",
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
  timeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(116, 159, 130, 0.08)",
  },
  timeCardPressed: {
    opacity: 0.9,
  },
  timeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  timeIconContainerSelected: {
    backgroundColor: COLORS.primary,
  },
  timeCardContent: {
    flex: 1,
  },
  timeCardLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 3,
  },
  timeCardLabelSelected: {
    color: COLORS.textDark,
  },
  timeCardDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
  },
  customTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignSelf: "center",
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  customTimeText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textDark,
  },
  timeList: {
    paddingHorizontal: 16,
  },
  timeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 2,
  },
  timeOptionSelected: {
    backgroundColor: COLORS.primaryLight,
  },
  timeOptionPressed: {
    backgroundColor: "#f3f4f6",
  },
  timeOptionText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  timeOptionTextSelected: {
    color: COLORS.textDark,
    fontWeight: "600",
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
  continueButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
