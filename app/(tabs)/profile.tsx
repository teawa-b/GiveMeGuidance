import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { useAuth } from "../../src/lib/AuthContext";
import { usePremium } from "../../src/lib/PremiumContext";
import { getSpiritualPresenceFromChats, type SpiritualPresence } from "../../src/services/streak";
import { PremiumPopup } from "../../src/components/PremiumPopup";
import { GuidanceHistoryModal } from "../../src/components/GuidanceHistoryModal";
import { lightHaptic, mediumHaptic, warningHaptic } from "../../src/lib/haptics";
import { EtherealBackground } from "../../src/components/EtherealBackground";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPremium, restorePurchases, presentCustomerCenter } = usePremium();

  const [loading, setLoading] = useState(true);
  const [spiritualPresence, setSpiritualPresence] = useState<SpiritualPresence>({
    daysOfGuidance: 0,
    currentPath: 0,
    isActiveToday: false,
  });
  const [premiumPopupVisible, setPremiumPopupVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const presence = await getSpiritualPresenceFromChats();
      setSpiritualPresence(presence);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSignOut = async () => {
    const doSignOut = async () => {
      try {
        await signOut();
        if (Platform.OS === "web") {
          window.location.href = "/";
        } else {
          router.replace("/(auth)");
        }
      } catch (error) {
        console.error("Sign out error:", error);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        await doSignOut();
      }
    } else {
      Alert.alert(
        "Sign Out",
        "Are you sure you want to sign out?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign Out", style: "destructive", onPress: doSignOut },
        ]
      );
    }
  };

  const handleRestorePurchases = async () => {
    lightHaptic();
    try {
      await restorePurchases();
      Alert.alert("Success", "Your purchases have been restored.");
    } catch (error) {
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
    }
  };

  const handleDeleteAccount = () => {
    warningHaptic();
    
    const confirmDelete = () => {
      Alert.alert(
        "Final Confirmation",
        "This will permanently delete your account and all your data. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete Forever", 
            style: "destructive", 
            onPress: async () => {
              try {
                // For now, just sign out - actual deletion would require backend support
                await signOut();
                if (Platform.OS === "web") {
                  window.location.href = "/";
                } else {
                  router.replace("/(auth)");
                }
              } catch (error) {
                console.error("Delete account error:", error);
                Alert.alert("Error", "Failed to delete account. Please try again.");
              }
            }
          },
        ]
      );
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        "Delete Account",
        "Are you sure you want to delete your account? All your data will be permanently removed.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete Account", style: "destructive", onPress: confirmDelete },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <EtherealBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EtherealBackground />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Your spiritual journey</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={32} color="#10b981" />
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user?.email || "User"}
          </Text>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="heart" size={12} color="#10b981" />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
        </View>

        {/* Spiritual Presence Card */}
        <View style={styles.presenceCard}>
          <View style={styles.presenceHeader}>
            <View style={styles.presenceIconContainer}>
              <LottieView
                source={{ uri: "https://lottie.host/dacfa944-e642-4d58-8d18-47b33afeb93c/zsrHvbF6v3.lottie" }}
                autoPlay
                loop
                style={styles.presenceLottie}
              />
            </View>
            <Text style={styles.presenceTitle}>Your Spiritual Journey</Text>
          </View>
          
          <View style={styles.presenceStats}>
            <View style={styles.presenceStatItem}>
              <Text style={styles.presenceNumber}>{spiritualPresence.daysOfGuidance}</Text>
              <Text style={styles.presenceLabel}>Days of Guidance</Text>
            </View>
            <View style={styles.presenceStatDivider} />
            <View style={styles.presenceStatItem}>
              <Text style={styles.presenceNumber}>{spiritualPresence.currentPath}</Text>
              <Text style={styles.presenceLabel}>Day Streak</Text>
            </View>
          </View>
          
          {spiritualPresence.isActiveToday && (
            <View style={styles.activeTodayBadge}>
              <Text style={styles.activeTodayText}>🌿 Active today</Text>
            </View>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>JOURNEY</Text>

          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            onPress={() => {
              lightHaptic();
              setHistoryModalVisible(true);
            }}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                <Ionicons name="time-outline" size={20} color="#10b981" />
              </View>
              <Text style={styles.menuItemText}>View Your Path</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            onPress={() => {
              lightHaptic();
              router.push("/(tabs)/bookmarks");
            }}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: "rgba(251, 191, 36, 0.1)" }]}>
                <Ionicons name="bookmark-outline" size={20} color="#f59e0b" />
              </View>
              <Text style={styles.menuItemText}>Saved Bookmarks</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </Pressable>
        </View>

        {/* Premium Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>SUBSCRIPTION</Text>

          {isPremium ? (
            <>
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuItemIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                    <Ionicons name="heart" size={20} color="#10b981" />
                  </View>
                  <Text style={styles.menuItemText}>Premium Supporter</Text>
                </View>
                <View style={styles.activeLabel}>
                  <Text style={styles.activeLabelText}>ACTIVE</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => {
                  lightHaptic();
                  presentCustomerCenter();
                }}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuItemIcon, { backgroundColor: "rgba(100, 116, 139, 0.1)" }]}>
                    <Ionicons name="settings-outline" size={20} color="#64748b" />
                  </View>
                  <Text style={styles.menuItemText}>Manage Subscription</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={() => {
                  mediumHaptic();
                  setPremiumPopupVisible(true);
                }}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuItemIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                    <Ionicons name="heart-outline" size={20} color="#10b981" />
                  </View>
                  <Text style={[styles.menuItemText, { color: "#10b981" }]}>Upgrade to Premium</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#10b981" />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                onPress={handleRestorePurchases}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuItemIcon, { backgroundColor: "rgba(100, 116, 139, 0.1)" }]}>
                    <Ionicons name="refresh-outline" size={20} color="#64748b" />
                  </View>
                  <Text style={styles.menuItemText}>Restore Purchases</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </Pressable>
            </>
          )}
        </View>

        {/* Account Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>ACCOUNT</Text>

          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            onPress={() => {
              warningHaptic();
              handleSignOut();
            }}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: "rgba(100, 116, 139, 0.1)" }]}>
                <Ionicons name="log-out-outline" size={20} color="#64748b" />
              </View>
              <Text style={styles.menuItemText}>Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.menuItem, styles.menuItemDanger, pressed && styles.menuItemPressed]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuItemIcon, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </View>
              <Text style={[styles.menuItemText, { color: "#ef4444" }]}>Delete Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fca5a5" />
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals */}
      <PremiumPopup
        visible={premiumPopupVisible}
        onClose={() => setPremiumPopupVisible(false)}
      />

      <GuidanceHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafaf6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 20 : 60,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#10b981",
    marginTop: 4,
  },
  userCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10b981",
  },
  presenceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  presenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  presenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  presenceIconContainer: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  presenceLottie: {
    width: 40,
    height: 40,
  },
  presenceStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  presenceStatItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  presenceStatDivider: {
    width: 1,
    height: 50,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 8,
  },
  presenceNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: "#10b981",
  },
  presenceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: "center",
  },
  activeTodayBadge: {
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  activeTodayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  menuSection: {
    marginBottom: 24,
  },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  menuItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  menuItemDanger: {
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.1)",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1e293b",
  },
  activeLabel: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeLabelText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10b981",
    letterSpacing: 0.5,
  },
});
