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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { TimeOfDay, timeDisplayNames } from "../../lib/OnboardingContext";

interface TimeSelectionScreenProps {
  selectedTime: TimeOfDay;
  customTime?: string;
  onTimeSelect: (time: TimeOfDay, customTime?: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

const timeOptions: { value: TimeOfDay; icon: string; description: string }[] = [
  { value: "morning", icon: "weather-sunny", description: "6 AM – 12 PM" },
  { value: "afternoon", icon: "white-balance-sunny", description: "12 PM – 5 PM" },
  { value: "evening", icon: "weather-night", description: "5 PM – 10 PM" },
  { value: "custom", icon: "clock-outline", description: "Pick a specific time" },
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
    if (!selectedTime) {
      if (hour < 12) {
        onTimeSelect("morning");
      } else if (hour < 17) {
        onTimeSelect("afternoon");
      } else {
        onTimeSelect("evening");
      }
    }
  }, []);

  const handleTimeOptionPress = (time: TimeOfDay) => {
    lightHaptic();
    if (time === "custom") {
      setShowTimePicker(true);
    } else {
      onTimeSelect(time);
    }
  };

  const handleCustomTimeSelect = (timeValue: string) => {
    lightHaptic();
    onTimeSelect("custom", timeValue);
    setShowTimePicker(false);
  };

  const formatCustomTime = (time?: string) => {
    if (!time) return "Pick a time";
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

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
              <View style={[styles.progressDot, styles.progressDotActive]} />
              <View style={styles.progressDot} />
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>When do you want your daily guidance?</Text>
            <Text style={styles.subtitle}>
              We'll prepare your guidance at this time
            </Text>
          </View>

          {/* Time Options */}
          <View style={styles.optionsContainer}>
            {timeOptions.map((option) => {
              const isSelected = selectedTime === option.value;
              const showCustomValue = option.value === "custom" && isSelected && customTime;

              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    pressed && styles.optionCardPressed,
                  ]}
                  onPress={() => handleTimeOptionPress(option.value)}
                >
                  <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
                    <MaterialCommunityIcons
                      name={option.icon as any}
                      size={24}
                      color={isSelected ? "#66b083" : "#9ca3af"}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                      {timeDisplayNames[option.value]}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {showCustomValue ? formatCustomTime(customTime) : option.description}
                    </Text>
                  </View>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

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
                    <Ionicons name="close" size={24} color="#6b7280" />
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
                        <Ionicons name="checkmark" size={20} color="#66b083" />
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
    flex: 1,
    gap: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
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
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
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
    backgroundColor: "#f0fdf4",
  },
  timeOptionPressed: {
    backgroundColor: "#f3f4f6",
  },
  timeOptionText: {
    fontSize: 16,
    color: "#4b5563",
  },
  timeOptionTextSelected: {
    color: "#1f2937",
    fontWeight: "600",
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
  continueButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
