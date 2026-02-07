import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Animated,
  Platform,
  StatusBar,
  Pressable,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { removeBookmark, removeMultipleBookmarks, type Bookmark } from "../../src/services/bookmarks";
import { useBookmarks } from "../../src/lib/DataCache";
import { useAuth } from "../../src/lib/AuthContext";
import { BookmarkCard } from "../../src/components/BookmarkCard";
import { EtherealBackground } from "../../src/components/EtherealBackground";
import { lightHaptic, selectionHaptic, errorHaptic, mediumHaptic } from "../../src/lib/haptics";

export default function BookmarksScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const loadingBird = require("../../assets/mascot/bird-reading.png");
  
  // Use cached bookmarks data
  const { 
    bookmarks, 
    isLoading, 
    isInitialLoad,
    refresh: fetchBookmarks,
    removeOptimistic: removeBookmarkOptimistic,
    removeMultipleOptimistic: removeMultipleBookmarksOptimistic,
  } = useBookmarks();
  
  // Multi-select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const listOpacity = useRef(new Animated.Value(0)).current;

  // Fetch bookmarks when screen comes into focus (uses cache, refreshes in background if stale)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchBookmarks();
      }
      // Exit select mode when screen loses focus
      return () => {
        setSelectMode(false);
        setSelectedIds(new Set());
      };
    }, [fetchBookmarks, isAuthenticated])
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    if (bookmarks === null) return;
    listOpacity.setValue(0);
    Animated.timing(listOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [bookmarks, isAuthenticated, listOpacity]);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <EtherealBackground />
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Bookmarks</Text>
            <Text style={styles.headerSubtitle}>Saved Verses</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bookmark-outline" size={48} color="#a7f3d0" />
          </View>
          <Text style={styles.emptyTitle}>Sign in to save bookmarks</Text>
          <Text style={styles.emptySubtitle}>
            You need an account to save verses and sync them across devices.
          </Text>
          <Pressable style={styles.authCtaButton} onPress={() => router.push("/(auth)")}>
            <Text style={styles.authCtaButtonText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleRemoveBookmark = async (bookmarkId: string) => {
    try {
      // Optimistic update - remove from UI immediately
      removeBookmarkOptimistic(bookmarkId);
      // Then delete from server
      await removeBookmark(bookmarkId);
    } catch (error) {
      console.error("Error removing bookmark:", error);
      // Refresh to restore correct state on error
      fetchBookmarks(true);
    }
  };

  const handleOpenVerse = (bookmark: Bookmark) => {
    router.push({
      pathname: "/guidance",
      params: {
        q: "Reflect on this verse",
        verseText: bookmark.verse_text,
        verseReference: bookmark.verse_reference,
      },
    });
  };

  const handleChatVerse = (bookmark: Bookmark) => {
    router.push({
      pathname: "/chat",
      params: {
        verseText: bookmark.verse_text,
        verseReference: bookmark.verse_reference,
        userQuestion: "Reflect on this verse",
      },
    });
  };

  // Toggle select mode
  const handleToggleSelectMode = () => {
    lightHaptic();
    if (selectMode) {
      setSelectedIds(new Set());
    }
    setSelectMode(!selectMode);
  };

  // Toggle selection for a single bookmark
  const handleToggleSelection = (bookmarkId: string) => {
    selectionHaptic();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookmarkId)) {
        newSet.delete(bookmarkId);
      } else {
        newSet.add(bookmarkId);
      }
      return newSet;
    });
  };

  // Select all bookmarks
  const handleSelectAll = () => {
    lightHaptic();
    if (bookmarks) {
      setSelectedIds(new Set(bookmarks.map(b => b.id)));
    }
  };

  // Delete selected bookmarks
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const doDeleteSelected = async () => {
      setIsDeleting(true);
      errorHaptic();
      
      const idsToDelete = Array.from(selectedIds);
      
      try {
        // Optimistic update - remove from UI immediately
        removeMultipleBookmarksOptimistic(idsToDelete);
        setSelectedIds(new Set());
        setSelectMode(false);
        
        // Then delete from server
        await removeMultipleBookmarks(idsToDelete);
      } catch (error) {
        console.error("Error deleting bookmarks:", error);
        Alert.alert("Error", "Failed to delete some bookmarks. Please try again.");
        // Refresh to restore correct state on error
        fetchBookmarks(true);
      } finally {
        setIsDeleting(false);
      }
    };

    const count = selectedIds.size;
    if (Platform.OS === "web") {
      if (window.confirm(`Delete ${count} bookmark${count > 1 ? "s" : ""}?`)) {
        await doDeleteSelected();
      }
    } else {
      Alert.alert(
        "Delete Bookmarks",
        `Are you sure you want to delete ${count} bookmark${count > 1 ? "s" : ""}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDeleteSelected },
        ]
      );
    }
  };

  // Loading state - only show loading spinner on initial load
  if (isInitialLoad && bookmarks === null) {
    return (
      <View style={styles.container}>
        <EtherealBackground />
        <View style={styles.centerContent}>
          <Image source={loadingBird} style={styles.loadingBird} resizeMode="contain" />
          <ActivityIndicator size="small" color="#10b981" style={styles.loadingSpinner} />
        </View>
      </View>
    );
  }

  // Empty state
  if (!bookmarks || bookmarks.length === 0) {
    return (
      <View style={styles.container}>
        <EtherealBackground />
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Bookmarks</Text>
            <Text style={styles.headerSubtitle}>Saved Verses</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bookmark-outline" size={48} color="#a7f3d0" />
          </View>
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptySubtitle}>
            Save verses that speak to you for later reflection.
          </Text>
        </View>
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
              <Text style={styles.selectCountText}>
                {selectedIds.size} selected
              </Text>
              <View style={styles.selectActions}>
                <Pressable 
                  style={styles.selectAllButton}
                  onPress={handleSelectAll}
                >
                  <Text style={styles.selectAllText}>Select All</Text>
                </Pressable>
              </View>
            </>
          ) : (
            // Normal header
            <>
              <View>
                <Text style={styles.headerTitle}>Bookmarks</Text>
                <Text style={styles.headerSubtitle}>Saved Verses</Text>
              </View>
              <Pressable 
                style={styles.selectButton}
                onPress={handleToggleSelectMode}
              >
                <Ionicons name="checkmark-circle-outline" size={22} color="#10b981" />
              </Pressable>
            </>
          )}
        </View>
      </View>

      {isLoading && (
        <View style={styles.inlineLoading}>
          <Image source={loadingBird} style={styles.inlineLoadingBird} resizeMode="contain" />
          <Text style={styles.inlineLoadingText}>Refreshing bookmarks...</Text>
        </View>
      )}

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
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: selectMode ? 120 : 100 }} />}
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.id);
            
            if (selectMode) {
              return (
                <Pressable
                  style={[
                    styles.selectableCard,
                    isSelected && styles.selectableCardSelected,
                  ]}
                  onPress={() => handleToggleSelection(item.id)}
                >
                  <View style={styles.checkboxContainer}>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.verseReference}>{item.verse_reference}</Text>
                    <Text style={styles.verseText} numberOfLines={2}>
                      "{item.verse_text}"
                    </Text>
                  </View>
                </Pressable>
              );
            }

            return (
              <Pressable
                onLongPress={() => {
                  mediumHaptic();
                  setSelectMode(true);
                  setSelectedIds(new Set([item.id]));
                }}
                delayLongPress={400}
              >
                <BookmarkCard
                  verseText={item.verse_text}
                  verseReference={item.verse_reference}
                  timestamp={new Date(item.created_at).getTime()}
                  onRemove={() => handleRemoveBookmark(item.id)}
                  onOpenVerse={() => handleOpenVerse(item)}
                  onChat={() => handleChatVerse(item)}
                />
              </Pressable>
            );
          }}
        />
      </Animated.View>

      {/* Delete button when in select mode */}
      {selectMode && selectedIds.size > 0 && (
        <View style={styles.deleteButtonContainer}>
          <Pressable
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteSelected}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#ffffff" />
                <Text style={styles.deleteButtonText}>
                  Delete {selectedIds.size} bookmark{selectedIds.size > 1 ? "s" : ""}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
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
  loadingBird: {
    width: 68,
    height: 68,
    marginBottom: 10,
  },
  loadingSpinner: {
    marginTop: 2,
  },
  authCtaButton: {
    marginTop: 20,
    backgroundColor: "#10b981",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  inlineLoadingBird: {
    width: 24,
    height: 24,
  },
  inlineLoadingText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  listAnimatedContainer: {
    flex: 1,
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
    alignItems: "center",
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
      },
    }),
  },
  cancelSelectButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelSelectText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748b",
  },
  selectCountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  selectActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#10b981",
  },
  
  listContent: {
    paddingHorizontal: 24,
  },
  
  // Selectable card
  selectableCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectableCardSelected: {
    borderColor: "#10b981",
    backgroundColor: "rgba(16, 185, 129, 0.05)",
  },
  checkboxContainer: {
    marginRight: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  checkboxSelected: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  cardContent: {
    flex: 1,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
    marginBottom: 4,
  },
  verseText: {
    fontSize: 15,
    color: "#475569",
    fontStyle: "italic",
    lineHeight: 22,
  },
  
  // Delete button
  deleteButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#ef4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
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
});

