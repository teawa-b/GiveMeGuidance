import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  Pressable,
  Alert,
  Image,
  StatusBar,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/lib/AuthContext";
import { EtherealBackground } from "../../src/components/EtherealBackground";
import { ProfileModal } from "../../src/components/ProfileModal";
import { GuidanceHistoryModal } from "../../src/components/GuidanceHistoryModal";
import { BannerAdComponent } from "../../src/components/BannerAdComponent";
import { PremiumPopup } from "../../src/components/PremiumPopup";
import { usePremium } from "../../src/lib/PremiumContext";
import { mediumHaptic, lightHaptic } from "../../src/lib/haptics";
import { getCurrentStreakDisplay } from "../../src/services/streak";
import { getBookmarks } from "../../src/services/bookmarks";

// Daily guidance status types
type DailyGuidanceStatus = "not_started" | "in_progress" | "completed";

// Dummy data for demonstration - will be replaced with real data
const DUMMY_DAILY_GUIDANCE = {
  verse: "\"Be still, and know that I am God.\"",
  reference: "Psalm 46:10",
  reflectionPreview: "In the chaos of life, God invites us to pause and trust His presence...",
  status: "not_started" as DailyGuidanceStatus,
};

const DUMMY_USER_PATH = {
  name: "Path of Peace",
  goal: "peace",
  description: "Daily guidance focused on peace and trust in God.",
};

export default function HomeScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { shouldShowPopup, markPopupShown } = usePremium();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [premiumPopupVisible, setPremiumPopupVisible] = useState(false);
  const [greeting, setGreeting] = useState("Good morning");
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    isActiveToday: false,
  });
  const [savedCount, setSavedCount] = useState(0);

  // Calculate week progress based on streak
  const getWeekProgress = (currentStreak: number): boolean[] => {
    const daysToShow = Math.min(currentStreak, 7);
    const progress: boolean[] = [];
    for (let i = 0; i < daysToShow; i++) {
      progress.push(true);
    }
    // Fill remaining with false
    while (progress.length < 7) {
      progress.push(false);
    }
    return progress;
  };

  // Fetch streak and saved data
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const [streak, bookmarks] = await Promise.all([
            getCurrentStreakDisplay(),
            getBookmarks(),
          ]);
          setStreakData(streak);
          setSavedCount(bookmarks?.length || 0);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchData();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting("Good morning");
      } else if (hour < 17) {
        setGreeting("Good afternoon");
      } else {
        setGreeting("Good evening");
      }
    }, [])
  );

  useEffect(() => {
    const checkPopup = async () => {
      const shouldShow = await shouldShowPopup();
      if (shouldShow) {
        setTimeout(() => {
          setPremiumPopupVisible(true);
        }, 2000);
      }
    };
    checkPopup();
  }, [shouldShowPopup]);

  const handleStartDailyGuidance = () => {
    mediumHaptic();
    router.push({
      pathname: "/guidance",
      params: { q: "daily guidance", daily: "true" },
    });
  };

  const handleViewPath = () => {
    lightHaptic();
    setHistoryModalVisible(true);
  };

  const handleViewSaved = () => {
    lightHaptic();
    router.push("/(tabs)/bookmarks");
  };

  const getStatusLabel = (status: DailyGuidanceStatus) => {
    switch (status) {
      case "not_started":
        return "NOT STARTED";
      case "in_progress":
        return "IN PROGRESS";
      case "completed":
        return "COMPLETED";
    }
  };

  const getStatusColor = (status: DailyGuidanceStatus) => {
    switch (status) {
      case "not_started":
        return "#9ca3af";
      case "in_progress":
        return "#f59e0b";
      case "completed":
        return "#10b981";
    }
  };

  const getCTAText = (status: DailyGuidanceStatus) => {
    switch (status) {
      case "not_started":
        return "Start today's guidance";
      case "in_progress":
        return "Continue";
      case "completed":
        return "Revisit today's guidance";
    }
  };

  const getUserInitials = () => {
    // Priority: display name from user_metadata (Google: name or full_name, Apple: full_name)
    const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name;
    if (displayName && typeof displayName === 'string' && displayName.trim().length > 0) {
      return displayName.trim().charAt(0).toUpperCase();
    }
    // Fallback to email
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <View style={styles.wrapper}>
      <EtherealBackground />

      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              {user?.user_metadata?.avatar_url ? (
                <Image
                  source={{ uri: user.user_metadata.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>{getUserInitials()}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.headerTitle}>Your Daily Walk</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={({ pressed }) => [
              styles.dailyGuidanceCard,
              pressed && styles.cardPressed,
            ]}
            onPress={handleStartDailyGuidance}
          >
            <View style={styles.dailyGuidanceHeader}>
              <View style={styles.dailyGuidanceTitleRow}>
                <MaterialCommunityIcons name="white-balance-sunny" size={18} color="#66b083" />
                <Text style={styles.dailyGuidanceLabel}>TODAY'S GUIDANCE</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(DUMMY_DAILY_GUIDANCE.status) }]} />
                <Text style={styles.statusText}>
                  {getStatusLabel(DUMMY_DAILY_GUIDANCE.status)}
                </Text>
              </View>
            </View>

            <View style={styles.verseSection}>
              <Text style={styles.verseText}>{DUMMY_DAILY_GUIDANCE.verse}</Text>
              <Text style={styles.verseReference}>{DUMMY_DAILY_GUIDANCE.reference}</Text>
              <Text style={styles.reflectionPreview}>
                {DUMMY_DAILY_GUIDANCE.reflectionPreview}
              </Text>
            </View>

            <View style={styles.dailyGuidanceCTA}>
              <Text style={styles.ctaText}>{getCTAText(DUMMY_DAILY_GUIDANCE.status)}</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </View>
          </Pressable>

          <View style={styles.twoColumnGrid}>
            <Pressable
              style={({ pressed }) => [
                styles.gridCard,
                pressed && styles.cardPressed,
              ]}
              onPress={handleViewPath}
            >
              <View style={styles.gridCardDecoration} />
              <View style={styles.gridCardContent}>
                <View style={styles.pathIconContainer}>
                  <MaterialCommunityIcons name="help-circle-outline" size={22} color="#66b083" />
                </View>
                <Text style={styles.gridCardLabel}>YOUR PATH</Text>
                <Text style={styles.pathName}>{DUMMY_USER_PATH.name}</Text>
              </View>
              <View style={styles.viewPathButton}>
                <Text style={styles.viewPathButtonText}>View Path</Text>
              </View>
            </Pressable>

            <View style={styles.gridCard}>
              <View style={styles.streakHeader}>
                <MaterialCommunityIcons name="leaf" size={20} color="#66b083" />
                <Text style={styles.streakLabel}>STREAK</Text>
              </View>
              <View style={styles.streakContent}>
                <Text style={styles.streakNumber}>
                  {streakData.currentStreak} <Text style={styles.streakDaysText}>days</Text>
                </Text>
                <Text style={styles.streakSubtext}>showing up</Text>
              </View>
              <View style={styles.streakProgressContainer}>
                {getWeekProgress(streakData.currentStreak).map((active, i) => (
                  <View
                    key={i}
                    style={[
                      styles.streakBar,
                      active ? styles.streakBarActive : styles.streakBarInactive,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.savedCard,
              pressed && styles.cardPressed,
            ]}
            onPress={handleViewSaved}
          >
            <View style={styles.savedContent}>
              <View style={styles.savedIconContainer}>
                <Ionicons name="bookmark" size={22} color="#9333ea" />
              </View>
              <View style={styles.savedTextContainer}>
                <Text style={styles.savedTitle}>Saved & Reflections</Text>
                <Text style={styles.savedSubtitle}>
                  You've saved {savedCount} pieces of guidance
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
          </Pressable>

          <BannerAdComponent style={styles.bannerAd} />
        </ScrollView>
      </SafeAreaView>

      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        onSignOut={() => {
          if (Platform.OS === "web") {
            if (window.confirm("Are you sure you want to sign out?")) {
              signOut();
              window.location.href = "/";
            }
          } else {
            Alert.alert("Sign Out", "Are you sure you want to sign out?", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive", onPress: () => signOut() },
            ]);
          }
        }}
        onViewHistory={() => {
          setProfileModalVisible(false);
          setHistoryModalVisible(true);
        }}
        onViewBookmarks={() => {
          setProfileModalVisible(false);
          router.push("/(tabs)/bookmarks");
        }}
      />

      <GuidanceHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
      />

      <PremiumPopup
        visible={premiumPopupVisible}
        onClose={() => {
          setPremiumPopupVisible(false);
          markPopupShown();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 12 : 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#dcfce7",
    borderWidth: 2,
    borderColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dcfce7",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#66b083",
  },
  headerTextContainer: {
    flexDirection: "column",
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  dailyGuidanceCard: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  dailyGuidanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dailyGuidanceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dailyGuidanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#66b083",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6b7280",
    letterSpacing: 0.3,
  },
  verseSection: {
    marginBottom: 20,
  },
  verseText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1f2937",
    lineHeight: 32,
    fontStyle: "italic",
    marginBottom: 8,
  },
  verseReference: {
    fontSize: 14,
    fontWeight: "500",
    color: "#66b083",
    marginBottom: 12,
  },
  reflectionPreview: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 22,
  },
  dailyGuidanceCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#66b083",
    paddingVertical: 14,
    borderRadius: 16,
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
      web: {
        boxShadow: "0 8px 24px rgba(102, 176, 131, 0.3)",
      },
    }),
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  twoColumnGrid: {
    flexDirection: "row",
    gap: 16,
  },
  gridCard: {
    flex: 1,
    height: 176,
    borderRadius: 24,
    padding: 20,
    backgroundColor: "#ffffff",
    justifyContent: "space-between",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  gridCardDecoration: {
    position: "absolute",
    right: -16,
    bottom: -16,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(220, 252, 231, 0.5)",
  },
  gridCardContent: {
    zIndex: 1,
  },
  pathIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  gridCardLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6b7280",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pathName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    lineHeight: 22,
  },
  viewPathButton: {
    backgroundColor: "#66b083",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    zIndex: 1,
  },
  viewPathButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#66b083",
    letterSpacing: 0.5,
  },
  streakContent: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
  },
  streakDaysText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#6b7280",
  },
  streakSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  streakProgressContainer: {
    flexDirection: "row",
    gap: 6,
  },
  streakBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  streakBarActive: {
    backgroundColor: "#66b083",
  },
  streakBarInactive: {
    backgroundColor: "#e5e7eb",
  },
  savedCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  savedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  savedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  savedTextContainer: {
    flex: 1,
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  savedSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  bannerAd: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
});
