
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  FlatList,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { type GuidanceHistoryEntry } from "../services/dailyGuidance";
import { getGuidancePathEntries } from "../services/chats";
import { lightHaptic, selectionHaptic } from "../lib/haptics";
import { usePremium } from "../lib/PremiumContext";
import { FREE_HISTORY_DAYS } from "../lib/premiumLimits";
import { PremiumPopup } from "./PremiumPopup";

// App logo
const appLogo = require("../../assets/mascot/bird-reading.png");

interface GuidanceHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export function GuidanceHistoryModal({ visible, onClose }: GuidanceHistoryModalProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [history, setHistory] = useState<GuidanceHistoryEntry[]>([]);
  const [allHistory, setAllHistory] = useState<GuidanceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [premiumPopupVisible, setPremiumPopupVisible] = useState(false);
  const { isPremium } = usePremium();

  // Number of entries hidden behind premium gate
  const hiddenCount = allHistory.length - history.length;

  useEffect(() => {
    if (visible) {
      fetchHistory();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getGuidancePathEntries();
      setAllHistory(data);

      if (isPremium) {
        setHistory(data);
      } else {
        // Free users: only show last FREE_HISTORY_DAYS days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - FREE_HISTORY_DAYS);
        cutoff.setHours(0, 0, 0, 0);
        const filtered = data.filter((entry) => new Date(entry.date) >= cutoff);
        setHistory(filtered);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const renderHistoryItem = ({ item, index }: { item: GuidanceHistoryEntry; index: number }) => (
    <View style={[styles.historyItem, index === 0 && styles.historyItemFirst]}>
      <View style={styles.historyDateColumn}>
        <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
        <View style={styles.timelineDot} />
        {index < history.length - 1 && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.historyContent}>
        <View style={styles.themeBadge}>
          <Text style={styles.themeBadgeText}>{item.theme}</Text>
        </View>
        <Text style={styles.historyPassage}>{item.passage}</Text>
        <Text style={styles.historySnippet} numberOfLines={2}>
          "{item.verseSnippet}"
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Image source={appLogo} style={styles.emptyLogo} resizeMode="contain" />
      <Text style={styles.emptyTitle}>Your Journey Begins</Text>
      <Text style={styles.emptySubtitle}>
        Each day you receive guidance, it will appear here as part of your path.
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={styles.overlayPress} onPress={handleClose} />
        
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerHandle} />
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Your Path</Text>
              <Text style={styles.headerSubtitle}>Guidance you've received</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={() => {
              lightHaptic();
              handleClose();
            }}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
              </View>
            ) : history.length === 0 ? (
              renderEmptyState()
            ) : (
              <FlatList
                data={history}
                renderItem={renderHistoryItem}
                keyExtractor={(item) => item.date}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={
                  !isPremium && hiddenCount > 0 ? (
                    <Pressable
                      style={styles.lockedFooter}
                      onPress={() => {
                        selectionHaptic();
                        setPremiumPopupVisible(true);
                      }}
                    >
                      <View style={styles.lockedIconRow}>
                        <Ionicons name="lock-closed" size={20} color="#5B8C5A" />
                        <Text style={styles.lockedTitle}>
                          {hiddenCount} more {hiddenCount === 1 ? "entry" : "entries"} hidden
                        </Text>
                      </View>
                      <Text style={styles.lockedSubtitle}>
                        Free accounts show the last {FREE_HISTORY_DAYS} days. Upgrade to Premium for your complete spiritual journey.
                      </Text>
                      <View style={styles.lockedButton}>
                        <Text style={styles.lockedButtonText}>Unlock Full History</Text>
                      </View>
                    </Pressable>
                  ) : null
                }
              />
            )}
          </View>
        </Animated.View>
      </Animated.View>

      <PremiumPopup
        visible={premiumPopupVisible}
        onClose={() => setPremiumPopupVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  overlayPress: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    minHeight: 400,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      default: {
        elevation: 8,
      },
      web: {
        boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.15)",
      },
    }),
  },
  header: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    marginBottom: 16,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 32,
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  listContent: {
    padding: 20,
  },
  historyItem: {
    flexDirection: "row",
    marginBottom: 20,
  },
  historyItemFirst: {
    marginTop: 0,
  },
  historyDateColumn: {
    width: 70,
    alignItems: "center",
  },
  historyDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    borderWidth: 2,
    borderColor: "#d1fae5",
  },
  timelineLine: {
    position: "absolute",
    top: 40,
    bottom: -20,
    width: 2,
    backgroundColor: "#e5e7eb",
  },
  historyContent: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 16,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  themeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  themeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  historyPassage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  historySnippet: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic",
    lineHeight: 18,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  lockedFooter: {
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    alignItems: "center",
  },
  lockedIconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  lockedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  lockedSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 14,
  },
  lockedButton: {
    backgroundColor: "#5B8C5A",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  lockedButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});

