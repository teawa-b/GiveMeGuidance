import React, { useEffect, useState, useRef } from "react";
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
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { TimeOfDay } from "../../lib/OnboardingContext";

const { width } = Dimensions.get("window");
const DIAL_SIZE = Math.min(width - 80, 300);

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
  dialBg: "#F8FAFC",
  dialTrack: "#E2E8F0",
};

// Subtle background tints for each time
const TIME_BG_COLORS: Record<string, string> = {
  morning: "rgba(251, 191, 36, 0.15)",    // Soft warm yellow
  afternoon: "rgba(251, 146, 60, 0.12)",  // Soft orange
  evening: "rgba(129, 140, 248, 0.15)",   // Soft indigo
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
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Animation values for each time button
  const morningScale = useRef(new Animated.Value(1)).current;
  const afternoonScale = useRef(new Animated.Value(1)).current;
  const eveningScale = useRef(new Animated.Value(1)).current;
  
  // Background tint animation
  const tintAnim = useRef(new Animated.Value(0)).current;
  
  const getScaleAnim = (id: TimeOfDay) => {
    switch (id) {
      case "morning": return morningScale;
      case "afternoon": return afternoonScale;
      case "evening": return eveningScale;
      default: return morningScale;
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
    
    // Animate the selected button
    const buttonScale = getScaleAnim(time);
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    
    onTimeSelect(time);
  };

  const handleCustomTimeSelect = (timeValue: string) => {
    lightHaptic();
    onTimeSelect("custom", timeValue);
    setShowTimePicker(false);
  };

  const getSelectedData = () => {
    if (selectedTime === "custom" && customTime) {
      const [hours, minutes] = customTime.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return {
        label: "Custom",
        description: `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`,
        icon: "time-outline" as keyof typeof Ionicons.glyphMap,
      };
    }
    return timeData.find((t) => t.id === selectedTime) || timeData[0];
  };
  
  // Get subtle background tint color
  const bgTintColor = selectedTime && selectedTime !== "custom" 
    ? TIME_BG_COLORS[selectedTime] 
    : TIME_BG_COLORS.morning;

  const selectedData = getSelectedData();

  // Calculate positions for dial buttons (morning top-left, afternoon right, evening bottom-left)
  const getDialPosition = (index: number) => {
    const angles = [-135, 0, 135]; // degrees from right (3 o'clock position)
    const angle = (angles[index] * Math.PI) / 180;
    const radius = DIAL_SIZE / 2 + 10;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

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

          {/* Dial */}
          <Animated.View
            style={[
              styles.dialContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Outer ring / track */}
            <View style={styles.dialOuter}>
              {/* Inner circle with selected info */}
              <View style={styles.dialInner}>
                <View style={styles.selectedIconContainer}>
                  <Ionicons name={selectedData.icon} size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.selectedLabel}>{selectedData.label}</Text>
                <Text style={styles.selectedDescription}>{selectedData.description}</Text>
              </View>

              {/* Time option buttons around the dial */}
              {timeData.map((time, index) => {
                const pos = getDialPosition(index);
                const isSelected = selectedTime === time.id;
                const buttonScaleAnim = getScaleAnim(time.id);
                
                return (
                  <Animated.View
                    key={time.id}
                    style={[
                      styles.dialButtonWrapper,
                      {
                        transform: [
                          { translateX: pos.x },
                          { translateY: pos.y },
                          { scale: buttonScaleAnim },
                        ],
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => handleTimeSelect(time.id)}
                      style={({ pressed }) => pressed && { opacity: 0.9 }}
                    >
                      <View style={[
                        styles.dialButton,
                        isSelected && styles.dialButtonSelected,
                      ]}>
                        <Ionicons
                          name={time.icon}
                          size={isSelected ? 26 : 22}
                          color={isSelected ? "#FFFFFF" : COLORS.primary}
                        />
                      </View>
                      <Text style={[
                        styles.dialButtonLabel,
                        isSelected && styles.dialButtonLabelSelected,
                      ]}>
                        {time.label}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

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
            <Ionicons name="time-outline" size={18} color={COLORS.textMuted} />
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 16 : 16,
    paddingBottom: 24,
    zIndex: 2,
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
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.textDark,
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  dialContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dialOuter: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 40,
      },
      android: {
        elevation: 8,
      },
    }),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  dialInner: {
    width: DIAL_SIZE - 80,
    height: DIAL_SIZE - 80,
    borderRadius: (DIAL_SIZE - 80) / 2,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  selectedLabel: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  selectedDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  dialButtonWrapper: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  dialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dialButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.surface,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dialButtonLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: "center",
  },
  dialButtonLabelSelected: {
    color: COLORS.primary,
    fontWeight: "700",
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
    paddingTop: 8,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
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
  continueButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  bgGlow: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  lightRayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    overflow: 'hidden',
  },
  lightRay: {
    position: 'absolute',
    top: -200,
    left: '10%',
    width: '80%',
    height: 500,
    borderRadius: 250,
    opacity: 1,
    transform: [{ scaleX: 1.5 }],
  },
});
