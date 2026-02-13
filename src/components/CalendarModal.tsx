import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { lightHaptic, selectionHaptic } from "../lib/haptics";

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  activityDates: string[];
  onDateSelect?: (date: string) => void;
  currentStreak: number;
  longestStreak: number;
  isLoading?: boolean;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function CalendarModal({
  visible,
  onClose,
  activityDates,
  onDateSelect,
  currentStreak,
  longestStreak,
  isLoading,
}: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Reset to current month when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentMonth(new Date());
    }
  }, [visible]);

  // Create a Set of activity dates for O(1) lookup
  const activityDateSet = useMemo(() => new Set(activityDates), [activityDates]);

  // Get calendar days for the current month view
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const days: Array<{ date: Date | null; isToday: boolean; hasActivity: boolean }> = [];
    
    // Add empty slots for days before the first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, isToday: false, hasActivity: false });
    }
    
    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split("T")[0];
      const isToday = date.toDateString() === today.toDateString();
      const hasActivity = activityDateSet.has(dateString);
      
      days.push({ date, isToday, hasActivity });
    }
    
    return days;
  }, [currentMonth, activityDateSet]);

  const goToPreviousMonth = () => {
    selectionHaptic();
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    selectionHaptic();
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDayPress = (date: Date | null) => {
    if (!date) return;
    const dateString = date.toISOString().split("T")[0];
    if (activityDateSet.has(dateString) && onDateSelect) {
      lightHaptic();
      onDateSelect(dateString);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Your Journey</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>

          {/* Streak Stats */}
          <View style={styles.streakContainer}>
            <View style={styles.streakCard}>
              <LinearGradient
                colors={["#fef3c7", "#fde68a"]}
                style={styles.streakGradient}
              >
                <Ionicons name="flame" size={42} color="#d97706" />
                <Text style={styles.streakNumber}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>Current Streak</Text>
              </LinearGradient>
            </View>
            <View style={styles.streakCard}>
              <LinearGradient
                colors={["#dbeafe", "#bfdbfe"]}
                style={styles.streakGradient}
              >
                <Ionicons name="trophy" size={42} color="#2563eb" />
                <Text style={styles.streakNumberBlue}>{longestStreak}</Text>
                <Text style={styles.streakLabelBlue}>Best Streak</Text>
              </LinearGradient>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
            </View>
          ) : (
            <>
              {/* Month Navigation */}
              <View style={styles.monthNav}>
                <Pressable 
                  style={styles.navButton} 
                  onPress={goToPreviousMonth}
                >
                  <Ionicons name="chevron-back" size={24} color="#10b981" />
                </Pressable>
                <Text style={styles.monthText}>
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>
                <Pressable 
                  style={styles.navButton} 
                  onPress={goToNextMonth}
                >
                  <Ionicons name="chevron-forward" size={24} color="#10b981" />
                </Pressable>
              </View>

              {/* Weekday Headers */}
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((day) => (
                  <Text key={day} style={styles.weekdayText}>{day}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {calendarDays.map((dayInfo, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.dayCell,
                      dayInfo.isToday && styles.todayCell,
                      dayInfo.hasActivity && styles.activityCell,
                    ]}
                    onPress={() => handleDayPress(dayInfo.date)}
                    disabled={!dayInfo.date || !dayInfo.hasActivity}
                  >
                    {dayInfo.date && (
                      <>
                        <Text
                          style={[
                            styles.dayText,
                            dayInfo.isToday && styles.todayText,
                            dayInfo.hasActivity && styles.activityText,
                          ]}
                        >
                          {dayInfo.date.getDate()}
                        </Text>
                        {dayInfo.hasActivity && (
                          <View style={styles.activityDot} />
                        )}
                      </>
                    )}
                  </Pressable>
                ))}
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendDotActivity]} />
                  <Text style={styles.legendText}>Guidance received</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendDotToday]} />
                  <Text style={styles.legendText}>Today</Text>
                </View>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  closeButton: {
    padding: 4,
  },
  
  // Streak Stats
  streakContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  streakCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  streakGradient: {
    padding: 16,
    alignItems: "center",
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: "#d97706",
  },
  streakNumberBlue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#2563eb",
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400e",
    marginTop: 2,
  },
  streakLabelBlue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e40af",
    marginTop: 2,
  },
  
  // Loading
  loadingContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Month Navigation
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#fafaf6",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  
  // Weekday Headers
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  
  // Calendar Grid
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  todayCell: {
    backgroundColor: "#fafaf6",
    borderRadius: 12,
  },
  activityCell: {
    backgroundColor: "#f5f5f0",
    borderRadius: 12,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#64748b",
  },
  todayText: {
    color: "#10b981",
    fontWeight: "700",
  },
  activityText: {
    color: "#059669",
    fontWeight: "600",
  },
  activityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#10b981",
    marginTop: 2,
  },
  
  // Legend
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDotActivity: {
    backgroundColor: "#10b981",
  },
  legendDotToday: {
    backgroundColor: "#fafaf6",
    borderWidth: 2,
    borderColor: "#10b981",
  },
  legendText: {
    fontSize: 13,
    color: "#64748b",
  },
});


