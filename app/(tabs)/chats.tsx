import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { deleteChat, deleteMultipleChats, type Chat } from "../../src/services/chats";
import { useChats, useStreak, useActivityDates } from "../../src/lib/DataCache";
import { useAuth } from "../../src/lib/AuthContext";
import { CalendarModal } from "../../src/components/CalendarModal";
import { lightHaptic, selectionHaptic, errorHaptic, mediumHaptic } from "../../src/lib/haptics";
import { EtherealBackground } from "../../src/components/EtherealBackground";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Group chats by date
interface ChatSection {
  title: string;
  data: Chat[];
}

const GENERIC_QUESTIONS = new Set([
  "reflect on this verse",
  "discuss this verse",
  "daily guidance",
]);

function isGenericQuestion(question: string): boolean {
  return GENERIC_QUESTIONS.has(question.toLowerCase().trim());
}

function isDailyGuidanceQuestion(question: string): boolean {
  return question.toLowerCase().trim() === "daily guidance";
}

function formatDailyGuidanceLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `Daily Guidance ${month}/${day}`;
}

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const loadingBird = require("../../assets/mascot/bird-reading.png");
  
  // Use cached data
  const { 
    chats, 
    isLoading: loading, 
    isInitialLoad,
    refresh: fetchChats,
    removeOptimistic: removeChatOptimistic,
    removeMultipleOptimistic: removeMultipleChatsOptimistic,
  } = useChats();
  
  const { 
    streak, 
    refresh: fetchStreak,
  } = useStreak();
  
  const { 
    activityDates, 
    isLoading: loadingCalendar,
    refresh: fetchActivityDates,
  } = useActivityDates();
  
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Derived streak values
  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;
  
  // Multi-select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const listOpacity = useRef(new Animated.Value(0)).current;
  const hasAnimatedIn = useRef(false);
  const sectionListRef = useRef<SectionList<Chat, ChatSection> | null>(null);
  const headerTopPadding = Math.max(
    insets.top + 6,
    Platform.OS !== "ios" && Platform.OS !== "web" ? (StatusBar.currentHeight ?? 0) + 10 : 16
  );

  useFocusEffect(
    useCallback(() => {
      // Scroll to top when screen comes into focus
      try {
        sectionListRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: false, viewOffset: 0 });
      } catch {}
      // Reset animation flag when screen comes into focus if data isn't loaded yet
      if (chats === null) {
        hasAnimatedIn.current = false;
      }
      // Reset search query when screen comes into focus
      setSearchQuery("");
      // Fetch data - uses cache, refreshes in background if stale
      if (isAuthenticated) {
        fetchChats();
        fetchStreak();
      }
    }, [fetchChats, fetchStreak, isAuthenticated, chats])
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    if (chats === null) return;
    if (hasAnimatedIn.current) return;
    
    hasAnimatedIn.current = true;
    listOpacity.setValue(0);
    Animated.timing(listOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [chats, isAuthenticated, listOpacity]);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <EtherealBackground variant="conversations" intensity="low" />
        <View style={[styles.header, { paddingTop: headerTopPadding }]}>
          <View style={styles.heroCard}>
            <Text style={styles.headerSubtitle}>CONVERSATIONS</Text>
            <Text style={styles.headerTitle}>Past Reflections</Text>
            <Text style={styles.heroDescription}>Save and sync every guided conversation.</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#a7f3d0" />
          </View>
          <Text style={styles.emptyTitle}>Sign in to save reflections</Text>
          <Text style={styles.emptySubtitle}>
            You need an account to save and sync your chat history.
          </Text>
          <Pressable style={styles.authCtaButton} onPress={() => router.push("/(auth)")}>
            <LinearGradient
              colors={["#22c58b", "#10b981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.authCtaGradient}
            >
              <Text style={styles.authCtaButtonText}>Sign In</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

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

  const visibleConversations = useMemo(
    () => groupedChats.reduce((count, section) => count + section.data.length, 0),
    [groupedChats]
  );

  const handleChatPress = (chat: Chat) => {
    selectionHaptic();
    setSelectedChat(chat);
    setShowActionModal(true);
  };

  const handleOpenVerse = () => {
    if (!selectedChat) return;
    lightHaptic();
    setShowActionModal(false);
    const isDailyGuidance = selectedChat.user_question.toLowerCase().trim() === "daily guidance";
    router.push({
      pathname: "/guidance",
      params: {
        q: selectedChat.user_question,
        verseText: selectedChat.verse_text,
        verseReference: selectedChat.verse_reference,
        explanationData: JSON.stringify(selectedChat.explanation_data),
        existingChatId: selectedChat.id, // Pass the existing chat ID to prevent duplicates
        ...(isDailyGuidance ? { daily: "true" } : {}),
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
        // Optimistic update - remove from UI immediately
        removeChatOptimistic(chatId);
        setShowActionModal(false);
        // Then delete from server
        await deleteChat(chatId);
      } catch (error) {
        console.error("Error deleting chat:", error);
        // Refresh to restore correct state on error
        fetchChats(true);
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
      
      const idsToDelete = Array.from(selectedChatIds);
      
      try {
        // Optimistic update - remove from UI immediately
        removeMultipleChatsOptimistic(idsToDelete);
        setSelectedChatIds(new Set());
        setSelectMode(false);
        
        // Then delete from server
        await deleteMultipleChats(idsToDelete);
      } catch (error) {
        console.error("Error deleting chats:", error);
        Alert.alert("Error", "Failed to delete some conversations. Please try again.");
        // Refresh to restore correct state on error
        fetchChats(true);
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
      // Show weekday with date, e.g., "Friday, Jan 17"
      return date.toLocaleDateString("en-US", { 
        weekday: "long", 
        month: "short", 
        day: "numeric" 
      });
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
          <View style={styles.chatHeader}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  isToday(item.updated_at) ? styles.statusDotActive : styles.statusDotInactive,
                ]}
              />
              <Text style={[styles.chatTime, isToday(item.updated_at) && styles.chatTimeToday]}>
                {formatDateTime(item.updated_at)}
              </Text>
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
          
          <Text style={styles.questionLabel}>You asked</Text>
          <Text style={styles.questionText} numberOfLines={2}>
            "{isDailyGuidanceQuestion(item.user_question)
              ? formatDailyGuidanceLabel(item.created_at)
              : isGenericQuestion(item.user_question)
                ? item.verse_reference
                : item.user_question}"
          </Text>
          
          <View style={styles.verseBlock}>
            <Text style={styles.verseReference}>{item.verse_reference}</Text>
            <Text style={styles.versePreview} numberOfLines={2}>
              "{item.verse_text}"
            </Text>
          </View>

          {!selectMode && (
            <View style={styles.openHintRow}>
              <Ionicons name="arrow-forward-circle-outline" size={14} color="#0f766e" />
              <Text style={styles.openHintText}>Open conversation</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: ChatSection }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
    </View>
  );

  // Loading state - only show loading spinner on initial load
  if (isInitialLoad && chats === null) {
    return (
      <View style={styles.container}>
        <EtherealBackground variant="conversations" intensity="low" />
        <View style={styles.centerContent}>
          <Image source={loadingBird} style={styles.loadingBird} resizeMode="contain" />
          <ActivityIndicator size="small" color="#10b981" style={styles.loadingSpinner} />
          <Text style={styles.loadingLabel}>Loading reflections...</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (!chats || chats.length === 0) {
    return (
      <View style={styles.container}>
        <EtherealBackground variant="conversations" intensity="low" />
        <View style={[styles.header, { paddingTop: headerTopPadding }]}>
          <View style={styles.heroCard}>
            <View style={styles.headerTop}>
              <View style={styles.headerTextBlock}>
                <Text style={styles.headerSubtitle}>CONVERSATIONS</Text>
                <Text style={styles.headerTitle}>Past Reflections</Text>
              </View>
              <Pressable style={styles.calendarButton} onPress={handleOpenCalendar}>
                <Ionicons name="calendar-outline" size={20} color="#0f766e" />
              </Pressable>
            </View>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaPill}>
                <Ionicons name="leaf-outline" size={13} color="#047857" />
                <Text style={styles.heroMetaText}>{currentStreak} day streak</Text>
              </View>
              <View style={styles.heroMetaPill}>
                <Ionicons name="chatbubble-ellipses-outline" size={13} color="#047857" />
                <Text style={styles.heroMetaText}>0 conversations</Text>
              </View>
            </View>
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
          <Pressable style={styles.authCtaButton} onPress={() => router.push("/(tabs)")}>
            <LinearGradient
              colors={["#22c58b", "#10b981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.authCtaGradient}
            >
              <Text style={styles.authCtaButtonText}>Get Guidance</Text>
            </LinearGradient>
          </Pressable>
        </View>
        <CalendarModal
          visible={showCalendar}
          onClose={() => setShowCalendar(false)}
          activityDates={activityDates || []}
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          isLoading={loadingCalendar}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EtherealBackground variant="conversations" intensity="low" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        {selectMode ? (
          <View style={styles.selectToolbar}>
            <Pressable
              style={styles.cancelSelectButton}
              onPress={handleToggleSelectMode}
            >
              <Text style={styles.cancelSelectText}>Cancel</Text>
            </Pressable>
            <View style={styles.selectToolbarCenter}>
              <Text style={styles.selectedCountText}>{selectedChatIds.size} selected</Text>
            </View>
            <Pressable
              style={styles.selectAllButton}
              onPress={handleSelectAll}
            >
              <Text style={styles.selectAllText}>Select all</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <View style={styles.headerTop}>
                <View style={styles.headerTextBlock}>
                  <Text style={styles.headerSubtitle}>CONVERSATIONS</Text>
                  <Text style={styles.headerTitle}>Past Reflections</Text>
                  <Text style={styles.heroDescription}>Revisit guidance and continue where you left off.</Text>
                </View>
                <View style={styles.headerButtons}>
                  {chats && chats.length > 0 && (
                    <Pressable
                      style={styles.selectButton}
                      onPress={handleToggleSelectMode}
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="#0f766e" />
                    </Pressable>
                  )}
                  <Pressable style={styles.calendarButton} onPress={handleOpenCalendar}>
                    <Ionicons name="calendar-outline" size={20} color="#0f766e" />
                  </Pressable>
                </View>
              </View>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaPill}>
                  <Ionicons name="leaf-outline" size={13} color="#047857" />
                  <Text style={styles.heroMetaText}>{currentStreak} day streak</Text>
                </View>
                <View style={styles.heroMetaPill}>
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color="#047857" />
                  <Text style={styles.heroMetaText}>{visibleConversations} shown</Text>
                </View>
              </View>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#0f766e" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                {...{["place" + "holder"]: "Search reflections, verses, or references..."}}
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable style={styles.searchClearButton} onPress={() => setSearchQuery("")} hitSlop={8}>
                  <Ionicons name="close" size={13} color="#64748b" />
                </Pressable>
              )}
            </View>
          </>
        )}
      </View>

      {loading && (
        <View style={styles.inlineLoading}>
          <Image source={loadingBird} style={styles.inlineLoadingBird} resizeMode="contain" />
          <Text style={styles.inlineLoadingText}>Refreshing conversations...</Text>
        </View>
      )}

      {/* Chat list */}
      <Animated.View
        style={[
          styles.listAnimatedContainer,
          {
            opacity: listOpacity,
            transform: [
              {
                translateY: listOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <SectionList<Chat, ChatSection>
          ref={sectionListRef}
          sections={groupedChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={[
            styles.listContent,
            selectMode && { paddingBottom: 120 }, // Extra space for delete button
          ]}
          showsVerticalScrollIndicator
          indicatorStyle="black"
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            searchQuery.trim().length > 0 ? (
              <View style={styles.searchEmptyContainer}>
                <Text style={styles.searchEmptyTitle}>No matching conversations</Text>
                <Text style={styles.searchEmptySubtitle}>Try a verse reference or fewer words.</Text>
              </View>
            ) : null
          }
          ListFooterComponent={<View style={styles.listFooterSpacer} />}
        />
      </Animated.View>

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
            <LinearGradient
              colors={["#f87171", "#ef4444", "#dc2626"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.floatingDeleteGradient}
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
            </LinearGradient>
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

            <LinearGradient
              colors={["rgba(214, 249, 228, 0.9)", "rgba(236, 253, 245, 0.95)", "rgba(255, 255, 255, 0.98)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeroCard}
            >
              <Text style={styles.modalTitle}>
                {selectedChat?.verse_reference}
              </Text>
              <Text style={styles.modalSubtitle} numberOfLines={2}>
                "{selectedChat?.verse_text}"
              </Text>
            </LinearGradient>

            <View style={styles.modalActions}>
              <Pressable 
                style={({ pressed }) => [styles.modalButton, pressed && styles.modalButtonPressed]} 
                onPress={handleOpenVerse}
              >
                <View style={styles.modalButtonIcon}>
                  <Ionicons name="book-outline" size={22} color="#10b981" />
                </View>
                <View style={styles.modalButtonTextContainer}>
                  <Text style={styles.modalButtonText}>Open Verse</Text>
                  <Text style={styles.modalButtonHint}>Get fresh guidance</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </Pressable>

              <Pressable 
                style={({ pressed }) => [styles.modalButton, pressed && styles.modalButtonPressed]} 
                onPress={handleContinueChat}
              >
                <View style={styles.modalButtonIcon}>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color="#10b981" />
                </View>
                <View style={styles.modalButtonTextContainer}>
                  <Text style={styles.modalButtonText}>Continue Chat</Text>
                  <Text style={styles.modalButtonHint}>Pick up where you left off</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </Pressable>

              <Pressable 
                style={({ pressed }) => [styles.modalButton, styles.deleteModalButton, pressed && styles.modalButtonPressed]} 
                onPress={() => selectedChat && handleDeleteChat(selectedChat.id)}
              >
                <View style={[styles.modalButtonIcon, styles.deleteButtonIcon]}>
                  <Ionicons name="trash-outline" size={22} color="#ef4444" />
                </View>
                <View style={styles.modalButtonTextContainer}>
                  <Text style={[styles.modalButtonText, styles.deleteButtonText]}>Delete Conversation</Text>
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
        activityDates={activityDates || []}
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
    backgroundColor: "#f7fcf8",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBird: {
    width: 68,
    height: 68,
    marginBottom: 10,
  },
  loadingSpinner: {
    marginTop: 2,
  },
  loadingLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  authCtaButton: {
    marginTop: 20,
    borderRadius: 14,
    overflow: "hidden",
    minWidth: 160,
  },
  authCtaGradient: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  authCtaButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  inlineLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.4)",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
  },
  inlineLoadingBird: {
    width: 20,
    height: 20,
  },
  inlineLoadingText: {
    fontSize: 12,
    color: "#0f766e",
    fontWeight: "600",
  },
  listAnimatedContainer: {
    flex: 1,
  },
  
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  heroCard: {
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTextBlock: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f766e",
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  heroDescription: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#0f766e",
    fontWeight: "500",
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  heroMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.16)",
  },
  heroMetaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
  },
  calendarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.88)",
        shadowColor: "#059669",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      default: {
        backgroundColor: "#ffffff",
        elevation: 3,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.88)",
        boxShadow: "0 2px 8px rgba(5, 150, 105, 0.1)",
      },
    }),
  },
  
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 11 : 9,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.16)",
    marginTop: 12,
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      default: {
        backgroundColor: "#ffffff",
        elevation: 1,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#334155",
    padding: 0,
  },
  searchClearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(226, 232, 240, 0.75)",
  },
  
  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 2,
  },
  sectionLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#6ee7b7",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: 1.2,
  },
  
  // Chat cards
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  listFooterSpacer: {
    height: 110,
  },
  chatCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    ...Platform.select({
      ios: {
        backgroundColor: "#ffffff",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      default: {
        backgroundColor: "#ffffff",
        elevation: 2,
      },
      web: {
        backgroundColor: "#ffffff",
        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.06)",
      },
    }),
  },
  chatCardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
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
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusDotActive: {
    backgroundColor: "#10b981",
  },
  statusDotInactive: {
    backgroundColor: "#cbd5e1",
  },
  chatTime: {
    fontSize: 14,
    fontWeight: "500",
    color: "#94a3b8",
  },
  chatTimeToday: {
    color: "#10b981",
    fontWeight: "600",
  },
  moreButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(241, 245, 249, 0.9)",
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
    marginBottom: 5,
  },
  questionText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    lineHeight: 24,
    marginBottom: 10,
  },
  verseBlock: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "rgba(16, 185, 129, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.1)",
  },
  verseReference: {
    fontSize: 14,
    fontWeight: "600",
    color: "#047857",
    marginBottom: 4,
  },
  versePreview: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#475569",
    lineHeight: 22,
  },
  openHintRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  openHintText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f766e",
  },
  searchEmptyContainer: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.22)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginTop: 16,
  },
  searchEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 5,
  },
  searchEmptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 20,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.12)",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.86)",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      default: {
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
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.56)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 38 : 22,
  },
  modalHandle: {
    width: 42,
    height: 4,
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  modalHeroCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.16)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#0f766e",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  modalActions: {
    gap: 9,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbe7f2",
  },
  modalButtonPressed: {
    opacity: 0.93,
  },
  modalButtonIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalButtonTextContainer: {
    flex: 1,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  modalButtonHint: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
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
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
  },

  // Multi-select mode styles
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    marginRight: 4,
  },
  selectToolbar: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  selectToolbarCenter: {
    flex: 1,
    alignItems: "center",
  },
  selectButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.24)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.88)",
        shadowColor: "#059669",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      default: {
        backgroundColor: "#ffffff",
        elevation: 3,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.88)",
        boxShadow: "0 2px 8px rgba(5, 150, 105, 0.1)",
      } as any,
    }),
  },
  cancelSelectButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cancelSelectText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f766e",
  },
  selectedCountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14532d",
  },
  selectAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 2,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f766e",
  },
  chatCardSelected: {
    backgroundColor: "rgba(16, 185, 129, 0.05)",
    borderColor: "#10b981",
  },
  chatCardSelectMode: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkboxContainer: {
    marginRight: 10,
    marginTop: 10,
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
    bottom: 96,
    left: 24,
    right: 24,
  },
  floatingDeleteButton: {
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#ef4444",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
      default: {
        elevation: 7,
      },
      web: {
        boxShadow: "0 5px 14px rgba(239, 68, 68, 0.3)",
      } as any,
    }),
  },
  floatingDeleteGradient: {
    minHeight: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  floatingDeleteButtonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  floatingDeleteButtonDisabled: {
    opacity: 0.7,
  },
  floatingDeleteText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});



