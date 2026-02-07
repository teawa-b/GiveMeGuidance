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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const loadingBird = require("../../assets/mascot/bird-reading.png");

  const {
    bookmarks,
    isLoading,
    isInitialLoad,
    refresh: fetchBookmarks,
    removeOptimistic: removeBookmarkOptimistic,
    removeMultipleOptimistic: removeMultipleBookmarksOptimistic,
  } = useBookmarks();

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const listOpacity = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const headerTopPadding = Math.max(
    insets.top + 6,
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 10 : 16
  );

  useFocusEffect(
    useCallback(() => {
      // Scroll to top when screen comes into focus
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });

      if (isAuthenticated) {
        fetchBookmarks();
      }

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

  const handleRemoveBookmark = async (bookmarkId: string) => {
    try {
      removeBookmarkOptimistic(bookmarkId);
      await removeBookmark(bookmarkId);
    } catch (error) {
      console.error("Error removing bookmark:", error);
      fetchBookmarks(true);
    }
  };

  const handleOpenVerse = (bookmark: Bookmark) => {
    router.push({
      pathname: "/guidance",
      params: {
        q: bookmark.verse_reference,
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
        userQuestion: bookmark.verse_reference,
      },
    });
  };

  const handleToggleSelectMode = () => {
    lightHaptic();
    if (selectMode) {
      setSelectedIds(new Set());
    }
    setSelectMode(!selectMode);
  };

  const handleToggleSelection = (bookmarkId: string) => {
    selectionHaptic();
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(bookmarkId)) {
        next.delete(bookmarkId);
      } else {
        next.add(bookmarkId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    lightHaptic();
    if (bookmarks) {
      setSelectedIds(new Set(bookmarks.map((bookmark) => bookmark.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const doDeleteSelected = async () => {
      setIsDeleting(true);
      errorHaptic();

      const idsToDelete = Array.from(selectedIds);

      try {
        removeMultipleBookmarksOptimistic(idsToDelete);
        setSelectedIds(new Set());
        setSelectMode(false);
        await removeMultipleBookmarks(idsToDelete);
      } catch (error) {
        console.error("Error deleting bookmarks:", error);
        Alert.alert("Error", "Failed to delete some bookmarks. Please try again.");
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

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <EtherealBackground variant="bookmarks" intensity="low" />

        <View style={[styles.header, { paddingTop: headerTopPadding }]}>
          <View style={styles.heroCard}>
            <Text style={styles.headerSubtitle}>BOOKMARKS</Text>
            <Text style={styles.headerTitle}>Saved Verses</Text>
            <Text style={styles.heroDescription}>Keep the verses that spoke to you close and ready to revisit.</Text>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bookmark-outline" size={48} color="#a7f3d0" />
          </View>
          <Text style={styles.emptyTitle}>Sign in to save bookmarks</Text>
          <Text style={styles.emptySubtitle}>You need an account to save verses and sync them across devices.</Text>
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

  if (isInitialLoad && bookmarks === null) {
    return (
      <View style={styles.container}>
        <EtherealBackground variant="bookmarks" intensity="low" />
        <View style={styles.centerContent}>
          <Image source={loadingBird} style={styles.loadingBird} resizeMode="contain" />
          <ActivityIndicator size="small" color="#10b981" style={styles.loadingSpinner} />
          <Text style={styles.loadingLabel}>Loading saved verses...</Text>
        </View>
      </View>
    );
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <View style={styles.container}>
        <EtherealBackground variant="bookmarks" intensity="low" />

        <View style={[styles.header, { paddingTop: headerTopPadding }]}>
          <View style={styles.heroCard}>
            <View style={styles.headerTop}>
              <View style={styles.headerTextBlock}>
                <Text style={styles.headerSubtitle}>BOOKMARKS</Text>
                <Text style={styles.headerTitle}>Saved Verses</Text>
              </View>
            </View>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaPill}>
                <Ionicons name="bookmark-outline" size={13} color="#047857" />
                <Text style={styles.heroMetaText}>0 saved</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bookmark-outline" size={48} color="#a7f3d0" />
          </View>
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptySubtitle}>Save verses that speak to you for later reflection.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EtherealBackground variant="bookmarks" intensity="low" />

      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        {selectMode ? (
          <View style={styles.selectToolbar}>
            <Pressable style={styles.cancelSelectButton} onPress={handleToggleSelectMode}>
              <Text style={styles.cancelSelectText}>Cancel</Text>
            </Pressable>
            <View style={styles.selectToolbarCenter}>
              <Text style={styles.selectCountText}>{selectedIds.size} selected</Text>
            </View>
            <Pressable style={styles.selectAllButton} onPress={handleSelectAll}>
              <Text style={styles.selectAllText}>Select all</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.heroCard}>
            <View style={styles.headerTop}>
              <View style={styles.headerTextBlock}>
                <Text style={styles.headerSubtitle}>BOOKMARKS</Text>
                <Text style={styles.headerTitle}>Saved Verses</Text>
                <Text style={styles.heroDescription}>Review, share, and continue conversations from your saved guidance.</Text>
              </View>
              <View style={styles.headerButtons}>
                <Pressable style={styles.selectButton} onPress={handleToggleSelectMode}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#0f766e" />
                </Pressable>
              </View>
            </View>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaPill}>
                <Ionicons name="bookmark-outline" size={13} color="#047857" />
                <Text style={styles.heroMetaText}>{bookmarks.length} saved</Text>
              </View>
            </View>
          </View>
        )}
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
          ref={flatListRef}
          data={bookmarks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator
          indicatorStyle="black"
          ListFooterComponent={<View style={{ height: selectMode ? 120 : 100 }} />}
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.id);
            const savedDate = new Date(item.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            if (selectMode) {
              return (
                <Pressable
                  style={[styles.selectableCard, isSelected && styles.selectableCardSelected]}
                  onPress={() => handleToggleSelection(item.id)}
                >
                  <View style={styles.checkboxContainer}>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.selectDateRow}>
                      <Text style={styles.verseReference}>{item.verse_reference}</Text>
                      <Text style={styles.savedDate}>{savedDate}</Text>
                    </View>
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

      {selectMode && selectedIds.size > 0 && (
        <View style={styles.deleteButtonContainer}>
          <Pressable
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteSelected}
            disabled={isDeleting}
          >
            <LinearGradient
              colors={["#f87171", "#ef4444", "#dc2626"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.deleteButtonGradient}
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
            </LinearGradient>
          </Pressable>
        </View>
      )}
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
    marginHorizontal: 20,
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
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    marginRight: 4,
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
      android: {
        backgroundColor: "#ffffff",
        elevation: 3,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.88)",
        boxShadow: "0 2px 8px rgba(5, 150, 105, 0.1)",
      },
    }),
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
  cancelSelectButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  cancelSelectText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f766e",
  },
  selectCountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14532d",
  },
  selectAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginRight: 2,
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f766e",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
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
    marginRight: 12,
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
  selectDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  savedDate: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94a3b8",
  },
  verseReference: {
    fontSize: 14,
    fontWeight: "600",
    color: "#047857",
  },
  verseText: {
    fontSize: 15,
    color: "#475569",
    fontStyle: "italic",
    lineHeight: 22,
  },
  deleteButtonContainer: {
    position: "absolute",
    bottom: 96,
    left: 20,
    right: 20,
  },
  deleteButton: {
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#ef4444",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
      android: {
        elevation: 7,
      },
      web: {
        boxShadow: "0 5px 14px rgba(239, 68, 68, 0.3)",
      },
    }),
  },
  deleteButtonGradient: {
    minHeight: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
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
});
