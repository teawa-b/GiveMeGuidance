import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  Modal,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { TimeOfDay } from "../../lib/OnboardingContext";
import { MascotBird } from "./MascotBird";
import { WarmBackground } from "./WarmBackground";
import { OB_COLORS, cardShadow, buttonShadow, softShadow } from "./theme";
import { LinearGradient } from "expo-linear-gradient";

interface TimeSelectionScreenProps {
  selectedTime: TimeOfDay;
  customTime?: string;
  onTimeSelect: (time: TimeOfDay, customTime?: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

const timeData: { id: TimeOfDay; label: string; description: string; icon: string; iconSet: "ion" | "mci"; color: string }[] = [
  { id: "morning", label: "Morning", description: "6 AM - 12 PM", icon: "weather-sunset-up", iconSet: "mci", color: "#D4A843" },
  { id: "afternoon", label: "Afternoon", description: "12 PM - 5 PM", icon: "sunny-outline", iconSet: "ion", color: "#E8963E" },
  { id: "evening", label: "Evening", description: "5 PM - 10 PM", icon: "moon-outline", iconSet: "ion", color: "#6B7DB3" },
];

const generateTimeOptions = () => {
  const times: { label: string; value: string }[] = [];
  for (let hour = 5; hour <= 22; hour++) {
    for (const minute of [0, 30]) {
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
  const insets = useSafeAreaInsets();

  const isWeb = Platform.OS === "web";
  const cardAnims = useRef(timeData.map(() => new Animated.Value(isWeb ? 1 : 0))).current;
  const cardSlides = useRef(timeData.map(() => new Animated.Value(isWeb ? 0 : 24))).current;

  useEffect(() => {
    const hour = new Date().getHours();
    if (!selectedTime || selectedTime === "custom") {
      if (hour < 12) onTimeSelect("morning");
      else if (hour < 17) onTimeSelect("afternoon");
      else onTimeSelect("evening");
    }

    if (!isWeb) {
      timeData.forEach((_, i) => {
        Animated.parallel([
          Animated.timing(cardAnims[i], { toValue: 1, duration: 400, delay: 350 + i * 100, useNativeDriver: true }),
          Animated.spring(cardSlides[i], { toValue: 0, tension: 60, friction: 9, delay: 350 + i * 100, useNativeDriver: true }),
        ]).start();
      });
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
          <ProgressSteps current={1} />
          <View style={styles.placeholder} />
        </View>

        <View style={styles.mascotRow}>
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>When works best?</Text>
            <View style={styles.speechTailRight} />
          </View>
          <MascotBird pose="pointing-right" size="small" animate delay={100} flip />
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>When do you want{"\n"}your guidance?</Text>
          <Text style={styles.subtitle}>Choose the perfect moment for your daily connection</Text>
        </View>

        <View style={styles.timeCardsContainer}>
          {timeData.map((time, i) => {
            const isSelected = selectedTime === time.id;
            return (
              <Animated.View key={time.id} style={{ opacity: cardAnims[i], transform: [{ translateY: cardSlides[i] }] }}>
                <Pressable
                  style={({ pressed }) => [styles.timeCard, isSelected && styles.timeCardSelected, pressed && styles.timeCardPressed]}
                  onPress={() => handleTimeSelect(time.id)}
                >
                  <View style={[styles.timeIconWrap, { backgroundColor: `${time.color}15` }]}>
                    {time.iconSet === "ion" ? (
                      <Ionicons name={time.icon as any} size={24} color={isSelected ? OB_COLORS.primaryDark : time.color} />
                    ) : (
                      <MaterialCommunityIcons name={time.icon as any} size={24} color={isSelected ? OB_COLORS.primaryDark : time.color} />
                    )}
                  </View>
                  <View style={styles.timeCardContent}>
                    <Text style={[styles.timeCardLabel, isSelected && styles.timeCardLabelSelected]}>{time.label}</Text>
                    <Text style={styles.timeCardDescription}>{time.description}</Text>
                  </View>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <Pressable
          style={({ pressed }) => [styles.customTimeButton, pressed && { opacity: 0.7 }]}
          onPress={() => {
            lightHaptic();
            setShowTimePicker(true);
          }}
        >
          <Ionicons name="time-outline" size={18} color={OB_COLORS.primary} />
          <Text style={styles.customTimeText}>Pick a specific time instead</Text>
        </Pressable>

        <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose a time</Text>
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <Ionicons name="close" size={24} color={OB_COLORS.textMuted} />
                </Pressable>
              </View>
              <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
                {TIME_OPTIONS.map((time) => (
                  <Pressable
                    key={time.value}
                    style={({ pressed }) => [styles.timeOption, customTime === time.value && styles.timeOptionSelected, pressed && styles.timeOptionPressed]}
                    onPress={() => handleCustomTimeSelect(time.value)}
                  >
                    <Text style={[styles.timeOptionText, customTime === time.value && styles.timeOptionTextSelected]}>{time.label}</Text>
                    {customTime === time.value && <Ionicons name="checkmark" size={20} color={OB_COLORS.primary} />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
  placeholder: { width: 42 },

  mascotRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 },
  speechBubble: {
    backgroundColor: OB_COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: OB_COLORS.primaryLight,
    position: "relative",
    ...softShadow,
  },
  speechText: { fontSize: 13, fontWeight: "600", color: OB_COLORS.primary },
  speechTailRight: {
    position: "absolute",
    right: -6,
    top: "50%",
    marginTop: -4,
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: OB_COLORS.primaryLight,
  },

  titleSection: { alignItems: "center", marginBottom: 14, paddingHorizontal: 16 },
  title: { fontSize: 23, fontWeight: "800", color: OB_COLORS.textDark, textAlign: "center", lineHeight: 30, letterSpacing: -0.4, marginBottom: 6 },
  subtitle: { fontSize: 14, color: OB_COLORS.textMuted, textAlign: "center" },

  timeCardsContainer: { gap: 14, marginBottom: 14, paddingHorizontal: 8 },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: OB_COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: "transparent",
    ...cardShadow,
  },
  timeCardSelected: { borderColor: OB_COLORS.primary, backgroundColor: OB_COLORS.primaryLight },
  timeCardPressed: { opacity: 0.9 },
  timeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  timeCardContent: { flex: 1 },
  timeCardLabel: { fontSize: 17, fontWeight: "700", color: OB_COLORS.textDark, marginBottom: 2 },
  timeCardLabelSelected: { color: OB_COLORS.primaryDark },
  timeCardDescription: { fontSize: 13, color: OB_COLORS.textMuted },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: OB_COLORS.border, alignItems: "center", justifyContent: "center" },
  radioOuterSelected: { borderColor: OB_COLORS.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: OB_COLORS.primary },

  customTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignSelf: "center",
    marginBottom: 10,
    backgroundColor: OB_COLORS.surface,
    borderWidth: 2,
    borderColor: OB_COLORS.primary,
    ...softShadow,
  },
  customTimeText: { fontSize: 14, color: OB_COLORS.primary, fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: OB_COLORS.surface,
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
    borderBottomColor: OB_COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: OB_COLORS.textDark },
  timeList: { paddingHorizontal: 16 },
  timeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 2,
  },
  timeOptionSelected: { backgroundColor: OB_COLORS.primaryLight },
  timeOptionPressed: { backgroundColor: "#f3f4f6" },
  timeOptionText: { fontSize: 16, color: OB_COLORS.textMuted },
  timeOptionTextSelected: { color: OB_COLORS.textDark, fontWeight: "600" },

  footer: { paddingTop: 12, paddingHorizontal: 24 },
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
  continueButtonText: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
