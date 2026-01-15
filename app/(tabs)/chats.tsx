import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  TextInput,
  Animated,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { getChats, deleteChat, deleteMultipleChats, type Chat } from "../../src/services/chats";
import { getSpiritualPresence, getGuidanceHistory } from "../../src/services/dailyGuidance";
import { getCurrentStreakDisplay, getActivityDates } from "../../src/services/streak";
import { CalendarModal } from "../../src/components/CalendarModal";
import { lightHaptic, selectionHaptic, errorHaptic, mediumHaptic } from "../../src/lib/haptics";
import { EtherealBackground } from "../../src/components/EtherealBackground";

// Group chats by date
interface ChatSection {
  title: string;
  data: Chat[];
}

export default function ChatsScreen() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [activityDates, setActivityDates] = useState<string[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  
  // Multi-select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchChats = useCallback(async () => {
    try {
      const data = await getChats();
      setChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPresenceData = useCallback(async () => {
    try {
      const streakData = await getCurrentStreakDisplay();
      setCurrentStreak(streakData.currentStreak);
      setLongestStreak(streakData.longestStreak);
    } catch (error) {
      console.error("Error fetching streak:", error);
    }
  }, []);

  const fetchActivityDates = useCallback(async () => {
    setLoadingCalendar(true);
    try {
      const dates = await getActivityDates();
      setActivityDates(dates);
    } catch (error) {
      console.error("Error fetching activity dates:", error);
    } finally {
      setLoadingCalendar(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Reset search query when screen comes into focus
      setSearchQuery("");
      fetchChats();
      fetchPresenceData();
    }, [fetchChats, fetchPresenceData])
  );

  const handleOpenCalendar = () => {
    lightHaptic();
    setShowCalendar(true);
    fetchActivityDates();
  };

  // Filter and group chats by date
  const groupedChats = useMemo(() => {
    if (!chats) return [];
    
    const filtered = searchQuery
      ? chats.filter(
          (chat) =>
            chat.user_question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.verse_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.verse_reference.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : chats;

    const groups: { [key: string]: Chat[] } = {};
    const now = new Date();
    
    filtered.forEach((chat) => {
      const date = new Date(chat.updated_at);
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      let groupKey: string;
      if (diffDays === 0) {
        groupKey = "Today";
      } else if (diffDays === 1) {
        groupKey = "Yesterday";
      } else if (diffDays < 7) {
        groupKey = "This Week";
      } else {
        groupKey = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(chat);
    });

    // Convert to sections array with proper ordering
    const orderedKeys = ["Today", "Yesterday", "This Week"];
    const sections: ChatSection[] = [];
    
    orderedKeys.forEach((key) => {
      if (groups[key]) {
        sections.push({ title: key, data: groups[key] });
        delete groups[key];
      }
    });
    
    // Add remaining date groups (sorted by date)
    Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .forEach((key) => {
        sections.push({ title: key, data: groups[key] });
      });

    return sections;
  }, [chats, searchQuery]);

  const handleChatPress = (chat: Chat) => {
    selectionHaptic();
    setSelectedChat(chat);
    setShowActionModal(true);
  };

  const handleOpenVerse = () => {
    if (!selectedChat) return;
    lightHaptic();
    setShowActionModal(false);
    router.push({
      pathname: "/guidance",
      params: {
        q: selectedChat.user_question,
        verseText: selectedChat.verse_text,
        verseReference: selectedChat.verse_reference,
        explanationData: JSON.stringify(selectedChat.explanation_data),
        existingChatId: selectedChat.id, // Pass the existing chat ID to prevent duplicates
      },
    });
  };

  const handleContinueChat = () => {
    if (!selectedChat) return;
    mediumHaptic();
    setShowActionModal(false);
    router.push({
      pathname: "/chat",
      params: { chatId: selectedChat.id },
    });
  };

  const handleDeleteChat = async (chatId: string) => {
    const doDelete = async () => {
      try {
        errorHaptic();
        await deleteChat(chatId);
        setShowActionModal(false);
        fetchChats();
      } catch (error) {
        console.error("Error deleting chat:", error);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Delete this conversation?")) {
        await doDelete();
      }
    } else {
      Alert.alert(
        "Delete Conversation",
        "Are you sure you want to delete this conversation?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDelete },
        ]
      );
    }
  };

  // Toggle select mode
  const handleToggleSelectMode = () => {
    lightHaptic();
    if (selectMode) {
      // Exiting select mode - clear selections
      setSelectedChatIds(new Set());
    }
    setSelectMode(!selectMode);
  };

  // Toggle selection for a single chat
  const handleToggleSelection = (chatId: string) => {
    selectionHaptic();
    setSelectedChatIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  };

  // Select all chats
  const handleSelectAll = () => {
    lightHaptic();
    if (chats) {
      setSelectedChatIds(new Set(chats.map(c => c.id)));
    }
  };

  // Delete selected chats
  const handleDeleteSelected = async () => {
    if (selectedChatIds.size === 0) return;

    const doDeleteSelected = async () => {
      setIsDeleting(true);
      errorHaptic();
      try {
        await deleteMultipleChats(Array.from(selectedChatIds));
        setSelectedChatIds(new Set());
        setSelectMode(false);
        fetchChats();
      } catch (error) {
        console.error("Error deleting chats:", error);
        Alert.alert("Error", "Failed to delete some conversations. Please try again.");
      } finally {
        setIsDeleting(false);
      }
    };

    const count = selectedChatIds.size;
    if (Platform.OS === "web") {
      if (window.confirm(`Delete ${count} conversation${count > 1 ? "s" : ""}?`)) {
        await doDeleteSelected();
      }
    } else {
      Alert.alert(
        "Delete Conversations",
        `Are you sure you want to delete ${count} conversation${count > 1 ? "s" : ""}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDeleteSelected },
        ]
      );
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "long" });
    } else {
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined
      });
    }
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    return date.toDateString() === now.toDateString();
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const isSelected = selectedChatIds.has(item.id);
    
    const handlePress = () => {
      if (selectMode) {
        handleToggleSelection(item.id);
      } else {
        handleChatPress(item);
      }
    };

    const handleLongPress = () => {
      if (!selectMode) {
        // Enter select mode on long press
        mediumHaptic();
        setSelectMode(true);
        setSelectedChatIds(new Set([item.id]));
      }
    };

    return (
      <Pressable 
        style={({ pressed }) => [
          styles.chatCard,
          pressed && styles.chatCardPressed,
          selectMode && isSelected && styles.chatCardSelected,
          selectMode && styles.chatCardSelectMode,
        ]} 
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={400}
      >
        {/* Selection checkbox */}
        {selectMode && (
          <View style={styles.checkboxContainer}>
            <View style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected,
            ]}>
              {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
          </View>
        )}
        
        <View style={selectMode ? styles.chatContentWithCheckbox : styles.chatContentFull}>
          {/* Status indicator and time */}
          <View style={styles.chatHeader}>
            <View style={styles.statusRow}>
              <View style={[
                styles.statusDot,
                isToday(item.updated_at) ? styles.statusDotActive : styles.statusDotInactive
              ]} />
              <Text style={styles.chatTime}>{formatDateTime(item.updated_at)}</Text>
            </View>
            {!selectMode && (
              <Pressable
                style={styles.moreButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleChatPress(item);
                }}
                hitSlop={8}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color="#cbd5e1" />
              </Pressable>
            )}
          </View>
          
          {/* Question */}
          <Text style={styles.questionText} numberOfLines={2}>
            "{item.user_question}"
          </Text>
          
          {/* Verse preview */}
          <Text style={styles.versePreview} numberOfLines={2}>
            "{item.verse_text}"
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: ChatSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
    </View>
  );

  // Loading state
  if (loading || chats === null) {
    return (
      <View style={styles.container}>
        <EtherealBackground />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </View>
    );
  }

  // Empty state
  if (chats.length === 0) {
    return (
      <View style={styles.container}>
        <EtherealBackground />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Conversations</Text>
              <Text style={styles.headerSubtitle}>Past Reflections</Text>
            </View>
            <Pressable style={styles.calendarButton} onPress={handleOpenCalendar}>
              <Ionicons name="calendar-outline" size={22} color="#10b981" />
            </Pressable>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#a7f3d0" />
          </View>
          <Text style={styles.emptyTitle}>No reflections yet</Text>
          <Text style={styles.emptySubtitle}>
            Get guidance on a verse and tap "Chat more" to start your journey.
          </Text>
        </View>
        <CalendarModal
          visible={showCalendar}
          onClose={() => setShowCalendar(false)}
          activityDates={activityDates}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          isLoading={loadingCalendar}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EtherealBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {selectMode ? (
            // Select mode header
            <>
              <Pressable 
                style={styles.cancelSelectButton} 
                onPress={handleToggleSelectMode}
              >
                <Text style={styles.cancelSelectText}>Cancel</Text>
              </Pressable>
              <Text style={styles.selectedCountText}>
                {selectedChatIds.size} selected
              </Text>
              <Pressable 
                style={styles.selectAllButton} 
                onPress={handleSelectAll}
              >
                <Text style={styles.selectAllText}>Select All</Text>
              </Pressable>
            </>
          ) : (
            // Normal header
            <>
              <View>
                <Text style={styles.headerTitle}>Conversations</Text>
                <Text style={styles.headerSubtitle}>Past Reflections</Text>
              </View>
              <View style={styles.headerButtons}>
                {chats && chats.length > 0 && (
                  <Pressable 
                    style={styles.selectButton} 
                    onPress={handleToggleSelectMode}
                  >
                    <Ionicons name="checkmark-circle-outline" size={22} color="#10b981" />
                  </Pressable>
                )}
                <Pressable style={styles.calendarButton} onPress={handleOpenCalendar}>
                  <Ionicons name="calendar-outline" size={22} color="#10b981" />
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* Search bar - hidden in select mode */}
        {!selectMode && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your reflections..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Chat list */}
      <SectionList
        sections={groupedChats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={[
          styles.listContent,
          selectMode && { paddingBottom: 120 }, // Extra space for delete button
        ]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* Floating Delete Button - shown in select mode */}
      {selectMode && selectedChatIds.size > 0 && (
        <View style={styles.floatingDeleteContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.floatingDeleteButton,
              pressed && styles.floatingDeleteButtonPressed,
              isDeleting && styles.floatingDeleteButtonDisabled,
            ]}
            onPress={handleDeleteSelected}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.floatingDeleteText}>
                  Delete {selectedChatIds.size} {selectedChatIds.size === 1 ? "Chat" : "Chats"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowActionModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            
            <Text style={styles.modalTitle}>
              {selectedChat?.verse_reference}
            </Text>
            <Text style={styles.modalSubtitle} numberOfLines={2}>
              "{selectedChat?.verse_text}"
            </Text>

            <View style={styles.modalActions}>
              <Pressable 
                style={({ pressed }) => [styles.modalButton, pressed && styles.modalButtonPressed]} 
                onPress={handleOpenVerse}
              >
                <View style={styles.modalButtonIcon}>
                  <Ionicons name="book" size={22} color="#10b981" />
                </View>
                <View style={styles.modalButtonTextContainer}>
                  <Text style={styles.modalButtonText}>Open Verse</Text>
                  <Text style={styles.modalButtonHint}>Get fresh guidance</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </Pressable>

              <Pressable 
                style={({ pressed }) => [styles.modalButton, pressed && styles.modalButtonPressed]} 
                onPress={handleContinueChat}
              >
                <View style={styles.modalButtonIcon}>
                  <Ionicons name="chatbubble" size={22} color="#10b981" />
                </View>
                <View style={styles.modalButtonTextContainer}>
                  <Text style={styles.modalButtonText}>Continue Chat</Text>
                  <Text style={styles.modalButtonHint}>Pick up where you left off</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </Pressable>

              <Pressable 
                style={({ pressed }) => [styles.modalButton, styles.deleteModalButton, pressed && styles.modalButtonPressed]} 
                onPress={() => selectedChat && handleDeleteChat(selectedChat.id)}
              >
                <View style={[styles.modalButtonIcon, styles.deleteButtonIcon]}>
                  <Ionicons name="trash-outline" size={22} color="#ef4444" />
                </View>
                <View style={styles.modalButtonTextContainer}>
                  <Text style={[styles.modalButtonText, styles.deleteButtonText]}>Delete</Text>
                  <Text style={styles.modalButtonHint}>Remove this reflection</Text>
                </View>
              </Pressable>
            </View>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Calendar Modal */}
      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        activityDates={activityDates}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        isLoading={loadingCalendar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafaf6",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 20 : 60,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#10b981",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  streakLottieContainer: {
    width: 22,
    height: 22,
  },
  streakLottie: {
    width: 22,
    height: 22,
  },
  streakCount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#d97706",
  },
  calendarButton: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.3)",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 2,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
      },
    }),
  },
  
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 1,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      },
    }),
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#334155",
    padding: 0,
  },
  
  // Section headers
  sectionHeader: {
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1.2,
  },
  
  // Chat cards
  listContent: {
    paddingHorizontal: 24,
  },
  chatCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(236, 253, 245, 0.8)",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 2,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.06)",
      },
    }),
  },
  chatCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: "#10b981",
  },
  statusDotInactive: {
    backgroundColor: "#e2e8f0",
  },
  chatTime: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
  },
  moreButton: {
    padding: 4,
  },
  questionText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1e293b",
    lineHeight: 24,
    marginBottom: 8,
  },
  versePreview: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#64748b",
    lineHeight: 20,
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 3,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)",
      },
    }),
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
  },
  
  // Modal
  modalOverlay: {
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
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    gap: 10,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalButtonPressed: {
    backgroundColor: "#f1f5f9",
  },
  modalButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  modalButtonTextContainer: {
    flex: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  modalButtonHint: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  deleteModalButton: {
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  deleteButtonIcon: {
    backgroundColor: "#fee2e2",
  },
  deleteButtonText: {
    color: "#ef4444",
  },
  cancelButton: {
    marginTop: 16,
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },

  // Multi-select mode styles
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectButton: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.3)",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 2,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
      } as any,
    }),
  },
  cancelSelectButton: {
    padding: 8,
  },
  cancelSelectText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  selectedCountText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1e293b",
  },
  selectAllButton: {
    padding: 8,
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10b981",
  },
  chatCardSelected: {
    backgroundColor: "rgba(236, 253, 245, 0.95)",
    borderColor: "#10b981",
  },
  chatCardSelectMode: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkboxContainer: {
    marginRight: 12,
    justifyContent: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  chatContentWithCheckbox: {
    flex: 1,
  },
  chatContentFull: {
    flex: 1,
  },
  floatingDeleteContainer: {
    position: "absolute",
    bottom: 100,
    left: 24,
    right: 24,
  },
  floatingDeleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#ef4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
      } as any,
    }),
  },
  floatingDeleteButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  floatingDeleteButtonDisabled: {
    opacity: 0.7,
  },
  floatingDeleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
