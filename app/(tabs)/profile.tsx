import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Animated,
  PanResponder,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { useAuth } from "../../src/lib/AuthContext";
import { usePremium } from "../../src/lib/PremiumContext";
import { getCurrentStreakDisplay } from "../../src/services/streak";
import { PremiumPopup } from "../../src/components/PremiumPopup";
import { GuidanceHistoryModal } from "../../src/components/GuidanceHistoryModal";
import { lightHaptic, mediumHaptic, warningHaptic } from "../../src/lib/haptics";
import { EtherealBackground } from "../../src/components/EtherealBackground";
import { supabase } from "../../src/lib/supabase";
import { deleteMyAccount } from "../../src/services/account";
import { useOnboarding } from "../../src/lib/OnboardingContext";
import {
  cancelAllReminderNotifications,
  getReminderScheduleSnapshot,
  requestAndScheduleDailyAndStreakReminders,
  scheduleReminderTestNotification,
  type ReminderScheduleSnapshot,
} from "../../src/services/notifications";

type EditProfileView = "main" | "changeEmail" | "changePassword" | "dangerZone" | "reminders";
const profileBird = require("../../assets/mascot/bird-pointing-right.png");
const loadingBird = require("../../assets/mascot/bird-reading.png");
const REMINDER_PRESET_TIMES = ["08:00", "12:00", "18:00", "21:00"] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPremium, restorePurchases, presentCustomerCenter } = usePremium();
  const { data: onboardingData, saveOnboarding } = useOnboarding();
  const isGuest = !user;

  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState<{
    currentStreak: number;
    longestStreak: number;
    isActiveToday: boolean;
  }>({
    currentStreak: 0,
    longestStreak: 0,
    isActiveToday: false,
  });
  const [premiumPopupVisible, setPremiumPopupVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editProfileView, setEditProfileView] = useState<EditProfileView>("main");
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [editProfileMessage, setEditProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [reminderTimeInput, setReminderTimeInput] = useState("08:00");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderSnapshot, setReminderSnapshot] = useState<ReminderScheduleSnapshot | null>(null);
  const editModalTranslateY = useRef(new Animated.Value(120)).current;
  const editModalDragY = useRef(new Animated.Value(0)).current;
  const isClosingModalRef = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to top when screen is focused
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCurrentStreakDisplay();
      setStreakData(data);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resolveReminderTimeFromPreferences = useCallback((): string => {
    if (onboardingData.preferredTimeOfDay === "custom" && onboardingData.customTime) {
      const normalizedCustomTime = onboardingData.customTime.trim();
      if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(normalizedCustomTime)) {
        return normalizedCustomTime;
      }
    }

    switch (onboardingData.preferredTimeOfDay) {
      case "afternoon":
        return "12:00";
      case "evening":
        return "18:00";
      case "morning":
      default:
        return "08:00";
    }
  }, [onboardingData.customTime, onboardingData.preferredTimeOfDay]);

  const isValidTimeInput = useCallback((value: string) => {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
  }, []);

  const sanitizeReminderInput = useCallback((value: string) => {
    return value.replace(/[^0-9:]/g, "").slice(0, 5);
  }, []);

  const formatTimeForDisplay = useCallback((value: string) => {
    if (!isValidTimeInput(value)) return value;
    const [hour, minute] = value.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  }, [isValidTimeInput]);

  const refreshReminderSnapshot = useCallback(async () => {
    try {
      const snapshot = await getReminderScheduleSnapshot();
      setReminderSnapshot(snapshot);
      return snapshot;
    } catch (error) {
      console.error("Failed to fetch reminder schedule snapshot:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!editProfileVisible) return;

    setReminderTimeInput(resolveReminderTimeFromPreferences());
    setReminderEnabled(onboardingData.notificationEnabled);
    void refreshReminderSnapshot();
  }, [
    editProfileVisible,
    onboardingData.notificationEnabled,
    refreshReminderSnapshot,
    resolveReminderTimeFromPreferences,
  ]);

  const buildOnboardingTimeOverrides = useCallback((hour: number, minute: number) => {
    if (hour === 8 && minute === 0) {
      return { preferredTimeOfDay: "morning" as const, customTime: undefined };
    }

    if (hour === 12 && minute === 0) {
      return { preferredTimeOfDay: "afternoon" as const, customTime: undefined };
    }

    if (hour === 18 && minute === 0) {
      return { preferredTimeOfDay: "evening" as const, customTime: undefined };
    }

    return {
      preferredTimeOfDay: "custom" as const,
      customTime: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
    };
  }, []);

  const handleSaveReminderSettings = useCallback(async () => {
    if (Platform.OS === "web") {
      setEditProfileMessage({
        type: "error",
        text: "Reminders are available on iOS and Android builds only.",
      });
      return;
    }

    const normalizedInput = reminderTimeInput.trim();
    if (!isValidTimeInput(normalizedInput)) {
      setEditProfileMessage({
        type: "error",
        text: "Enter time as HH:MM in 24-hour format (for example, 21:00).",
      });
      return;
    }

    const [hour, minute] = normalizedInput.split(":").map(Number);

    setEditProfileLoading(true);
    setEditProfileMessage(null);

    try {
      const scheduled = await requestAndScheduleDailyAndStreakReminders(
        { hour, minute },
        { streakTime: { hour: 23, minute: 30 } }
      );

      if (!scheduled) {
        setEditProfileMessage({
          type: "error",
          text: "Could not schedule reminders. Enable notifications in system Settings and try again.",
        });
        return;
      }

      await saveOnboarding({
        ...buildOnboardingTimeOverrides(hour, minute),
        notificationEnabled: true,
      });

      setReminderEnabled(true);
      await refreshReminderSnapshot();
      setEditProfileMessage({
        type: "success",
        text: `Reminders are active. Daily at ${formatTimeForDisplay(normalizedInput)} and streak at 11:30 PM.`,
      });
    } catch (error: any) {
      console.error("Failed to save reminder settings:", error);
      setEditProfileMessage({
        type: "error",
        text: error?.message || "Unable to update reminders right now.",
      });
    } finally {
      setEditProfileLoading(false);
    }
  }, [
    buildOnboardingTimeOverrides,
    formatTimeForDisplay,
    isValidTimeInput,
    reminderTimeInput,
    refreshReminderSnapshot,
    saveOnboarding,
  ]);

  const handleDisableReminders = useCallback(async () => {
    if (Platform.OS === "web") {
      setEditProfileMessage({
        type: "error",
        text: "No local reminder schedules are available on web.",
      });
      return;
    }

    setEditProfileLoading(true);
    setEditProfileMessage(null);

    try {
      await cancelAllReminderNotifications();
      await saveOnboarding({ notificationEnabled: false });
      setReminderEnabled(false);
      await refreshReminderSnapshot();
      setEditProfileMessage({
        type: "success",
        text: "Reminders are now turned off.",
      });
    } catch (error: any) {
      console.error("Failed to disable reminders:", error);
      setEditProfileMessage({
        type: "error",
        text: error?.message || "Unable to disable reminders right now.",
      });
    } finally {
      setEditProfileLoading(false);
    }
  }, [refreshReminderSnapshot, saveOnboarding]);

  const handleVerifyReminderSetup = useCallback(async () => {
    if (Platform.OS === "web") {
      setEditProfileMessage({
        type: "error",
        text: "Verification is only available on iOS and Android builds.",
      });
      return;
    }

    setEditProfileLoading(true);
    setEditProfileMessage(null);

    try {
      const snapshot = await refreshReminderSnapshot();
      if (!snapshot) {
        setEditProfileMessage({
          type: "error",
          text: "Could not verify reminder status.",
        });
        return;
      }

      if (!snapshot.permissionGranted) {
        setEditProfileMessage({
          type: "error",
          text: "Notification permission is not granted.",
        });
        return;
      }

      if (snapshot.dailyReminderScheduled && snapshot.streakReminderScheduled) {
        setEditProfileMessage({
          type: "success",
          text: "Verification passed: daily and streak reminders are scheduled.",
        });
      } else {
        setEditProfileMessage({
          type: "error",
          text: "Verification failed: one or more reminders are missing. Re-save reminder settings.",
        });
      }
    } finally {
      setEditProfileLoading(false);
    }
  }, [refreshReminderSnapshot]);

  const handleSendTestReminder = useCallback(async () => {
    if (Platform.OS === "web") {
      setEditProfileMessage({
        type: "error",
        text: "Test reminders are only available on iOS and Android builds.",
      });
      return;
    }

    setEditProfileLoading(true);
    setEditProfileMessage(null);

    try {
      const scheduled = await scheduleReminderTestNotification(15);
      if (!scheduled) {
        setEditProfileMessage({
          type: "error",
          text: "Could not schedule the test reminder. Check notification permission.",
        });
        return;
      }

      setEditProfileMessage({
        type: "success",
        text: "Test reminder scheduled for ~15 seconds from now.",
      });
      await refreshReminderSnapshot();
    } finally {
      setEditProfileLoading(false);
    }
  }, [refreshReminderSnapshot]);

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

    const performDelete = async () => {
      setEditProfileLoading(true);
      setEditProfileMessage(null);

      try {
        // Backend delete must succeed first; account is removed in auth.users.
        await deleteMyAccount();

        // Then clear local auth/session state.
        try {
          await signOut();
        } catch (signOutError) {
          console.warn("Sign out after deletion failed:", signOutError);
        }

        if (Platform.OS === "web") {
          window.location.href = "/";
        } else {
          router.replace("/(auth)");
        }
      } catch (error: any) {
        console.error("Delete account error:", error);
        Alert.alert("Error", error?.message || "Failed to delete account. Please try again.");
      } finally {
        setEditProfileLoading(false);
      }
    };

    const confirmDelete = () => {
      Alert.alert(
        "Final Confirmation",
        "This will permanently delete your account and all your data. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete Forever", 
            style: "destructive", 
            onPress: performDelete
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

  const resetEditProfileForm = () => {
    setEditProfileView("main");
    setEditProfileMessage(null);
    setNewEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setDeleteConfirmText("");
  };

  const openEditProfile = () => {
    if (isGuest) {
      handleCreateAccountAndSaveData();
      return;
    }
    setEditProfileVisible(true);
    setEditProfileView("main");
    setEditProfileMessage(null);
    try {
      lightHaptic();
    } catch (error) {
      console.warn("Haptic feedback failed while opening Edit Profile:", error);
    }
  };

  const finalizeCloseEditProfile = useCallback(() => {
    setEditProfileVisible(false);
    setEditProfileLoading(false);
    resetEditProfileForm();
    isClosingModalRef.current = false;
  }, []);

  const animateEditProfileIn = useCallback(() => {
    editModalTranslateY.setValue(120);
    editModalDragY.setValue(0);
    Animated.spring(editModalTranslateY, {
      toValue: 0,
      damping: 20,
      stiffness: 220,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
  }, [editModalDragY, editModalTranslateY]);

  const closeEditProfile = useCallback(() => {
    if (isClosingModalRef.current) return;
    isClosingModalRef.current = true;

    Animated.timing(editModalTranslateY, {
      toValue: 420,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      finalizeCloseEditProfile();
    });
  }, [editModalTranslateY, finalizeCloseEditProfile]);

  useEffect(() => {
    if (!editProfileVisible) return;

    animateEditProfileIn();
  }, [animateEditProfileIn, editProfileVisible]);

  const editHandlePanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) => Math.abs(gestureState.dy) > 4,
        onPanResponderMove: (_evt, gestureState) => {
          editModalDragY.setValue(Math.max(0, gestureState.dy));
        },
        onPanResponderRelease: (_evt, gestureState) => {
          const shouldClose = gestureState.dy > 120 || gestureState.vy > 1;

          if (shouldClose) {
            isClosingModalRef.current = true;
            Animated.timing(editModalDragY, {
              toValue: 420,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              finalizeCloseEditProfile();
            });
            return;
          }

          Animated.spring(editModalDragY, {
            toValue: 0,
            damping: 18,
            stiffness: 260,
            mass: 0.8,
            useNativeDriver: true,
          }).start();
        },
      }),
    [editModalDragY, editModalTranslateY, finalizeCloseEditProfile]
  );

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      setEditProfileMessage({ type: "error", text: "Please enter a new email address." });
      return;
    }

    setEditProfileLoading(true);
    setEditProfileMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;

      setEditProfileMessage({
        type: "success",
        text: "Verification email sent. Please check your inbox to confirm.",
      });
      setNewEmail("");
    } catch (error: any) {
      setEditProfileMessage({
        type: "error",
        text: error?.message || "Unable to update email right now.",
      });
    } finally {
      setEditProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setEditProfileMessage({ type: "error", text: "Please complete all password fields." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setEditProfileMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setEditProfileMessage({
        type: "error",
        text: "Password must be at least 6 characters long.",
      });
      return;
    }

    setEditProfileLoading(true);
    setEditProfileMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setEditProfileMessage({ type: "success", text: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setEditProfileMessage({
        type: "error",
        text: error?.message || "Unable to update password right now.",
      });
    } finally {
      setEditProfileLoading(false);
    }
  };

  const handleDangerZoneDelete = () => {
    if (deleteConfirmText !== "DELETE") {
      setEditProfileMessage({ type: "error", text: 'Type "DELETE" to continue.' });
      return;
    }
    closeEditProfile();
    handleDeleteAccount();
  };

  const handleCreateAccountAndSaveData = () => {
    lightHaptic();
    const message = "Create an account to save your streak, bookmarks, and guidance across devices.";

    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        router.push("/(auth)");
      }
      return;
    }

    Alert.alert("Save your data", message, [
      { text: "Not now", style: "cancel" },
      { text: "Create account", onPress: () => router.push("/(auth)") },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <EtherealBackground />
        <View style={styles.loadingContainer}>
          <Image source={loadingBird} style={styles.loadingBird} resizeMode="contain" />
          <ActivityIndicator size="small" color="#10b981" style={styles.loadingSpinner} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EtherealBackground />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Your spiritual journey</Text>
          </View>
          <Image source={profileBird} style={styles.headerBird} resizeMode="contain" />
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={32} color="#10b981" />
          </View>
          {isGuest ? (
            <Text style={styles.userEmail} numberOfLines={1}>
              Guest
            </Text>
          ) : (
            <>
              <Pressable
                style={({ pressed }) => [styles.editProfileTrigger, pressed && styles.menuItemPressed]}
                onPress={openEditProfile}
              >
                <Ionicons name="create-outline" size={16} color="#10b981" />
                <Text style={styles.editProfileTriggerText}>Edit profile</Text>
                <Ionicons name="chevron-forward" size={14} color="#10b981" />
              </Pressable>
              <Text style={styles.userEmailHint} numberOfLines={1}>
                {user?.email}
              </Text>
            </>
          )}
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
                renderMode={Platform.OS === "android" ? "SOFTWARE" : "AUTOMATIC"}
                style={styles.presenceLottie}
              />
            </View>
          </View>
          <Text style={styles.presenceTitle}>Your Spiritual Journey</Text>
          
          <View style={styles.presenceStats}>
            <View style={styles.presenceStatItem}>
              <Text style={styles.presenceNumber}>{streakData.currentStreak}</Text>
              <Text style={styles.presenceLabel}>Current Streak</Text>
            </View>
            <View style={styles.presenceStatDivider} />
            <View style={styles.presenceStatItem}>
              <Text style={styles.presenceNumber}>{streakData.longestStreak}</Text>
              <Text style={styles.presenceLabel}>Longest Streak</Text>
            </View>
          </View>
          
          {streakData.isActiveToday && (
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

          {isGuest ? (
            <Pressable
              style={({ pressed }) => [styles.guestCtaWrap, pressed && styles.menuItemPressed]}
              onPress={handleCreateAccountAndSaveData}
            >
              <LinearGradient
                colors={["#5B8C5A", "#4A7A49"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.guestCtaCard}
              >
                <View style={styles.guestCtaIconWrap}>
                  <Ionicons name="cloud-upload-outline" size={20} color="#4A7A49" />
                </View>
                <View style={styles.guestCtaTextWrap}>
                  <Text style={styles.guestCtaTitle}>Create account and save your data</Text>
                  <Text style={styles.guestCtaSubtitle}>Keep your streak, bookmarks, and guidance across devices</Text>
                </View>
                <View style={styles.guestCtaArrow}>
                  <Ionicons name="arrow-forward" size={16} color="#4A7A49" />
                </View>
              </LinearGradient>
            </Pressable>
          ) : (
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
          )}
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

      <Modal
        visible={editProfileVisible}
        transparent
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeEditProfile}
      >
        <View style={styles.editModalOverlay}>
          <Pressable style={styles.editModalBackdrop} onPress={closeEditProfile} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.editModalWrap}
          >
            <Animated.View
              style={[
                styles.editModalCard,
                {
                  transform: [{ translateY: Animated.add(editModalTranslateY, editModalDragY) }],
                },
              ]}
            >
              <View style={styles.editModalHandleTouch} {...editHandlePanResponder.panHandlers}>
                <View style={styles.editModalHandle} />
              </View>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>
                  {editProfileView === "main"
                    ? "Edit Profile"
                    : editProfileView === "changeEmail"
                    ? "Change Email"
                    : editProfileView === "changePassword"
                    ? "Change Password"
                    : editProfileView === "reminders"
                    ? "Reminder Settings"
                    : "Danger Zone"}
                </Text>
                <Pressable onPress={closeEditProfile} style={styles.editModalCloseButton}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.editModalContent}
                contentContainerStyle={styles.editModalContentContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {editProfileView === "main" && (
                  <>
                    <View style={styles.editProfileIdentity}>
                      <View style={styles.editProfileIdentityIcon}>
                        <Ionicons name="person" size={22} color="#10b981" />
                      </View>
                      <Text style={styles.editProfileIdentityLabel}>Signed in as</Text>
                      <Text style={styles.editProfileIdentityEmail}>{user?.email}</Text>
                    </View>

                    <Pressable
                      style={({ pressed }) => [styles.editActionItem, pressed && styles.menuItemPressed]}
                      onPress={() => {
                        lightHaptic();
                        setEditProfileMessage(null);
                        setEditProfileView("changeEmail");
                      }}
                    >
                      <View style={styles.editActionItemLeft}>
                        <View style={[styles.menuItemIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                          <Ionicons name="mail-outline" size={18} color="#10b981" />
                        </View>
                        <Text style={styles.editActionItemText}>Change Email</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [styles.editActionItem, pressed && styles.menuItemPressed]}
                      onPress={() => {
                        lightHaptic();
                        setEditProfileMessage(null);
                        setEditProfileView("changePassword");
                      }}
                    >
                      <View style={styles.editActionItemLeft}>
                        <View style={[styles.menuItemIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                          <Ionicons name="lock-closed-outline" size={18} color="#10b981" />
                        </View>
                        <Text style={styles.editActionItemText}>Change Password</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [styles.editActionItem, pressed && styles.menuItemPressed]}
                      onPress={() => {
                        lightHaptic();
                        setEditProfileMessage(null);
                        setReminderTimeInput(resolveReminderTimeFromPreferences());
                        setReminderEnabled(onboardingData.notificationEnabled);
                        setEditProfileView("reminders");
                        void refreshReminderSnapshot();
                      }}
                    >
                      <View style={styles.editActionItemLeft}>
                        <View style={[styles.menuItemIcon, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                          <Ionicons name="notifications-outline" size={18} color="#10b981" />
                        </View>
                        <Text style={styles.editActionItemText}>Reminder Settings</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [styles.editActionItem, pressed && styles.menuItemPressed]}
                      onPress={() => {
                        warningHaptic();
                        closeEditProfile();
                        handleSignOut();
                      }}
                    >
                      <View style={styles.editActionItemLeft}>
                        <View style={[styles.menuItemIcon, { backgroundColor: "rgba(100, 116, 139, 0.12)" }]}>
                          <Ionicons name="log-out-outline" size={18} color="#64748b" />
                        </View>
                        <Text style={styles.editActionItemText}>Sign Out</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.editActionItem,
                        styles.editActionDanger,
                        pressed && styles.menuItemPressed,
                        { paddingVertical: 10 }
                      ]}
                      onPress={() => {
                        warningHaptic();
                        setEditProfileMessage(null);
                        setEditProfileView("dangerZone");
                      }}
                    >
                      <View style={styles.editActionItemLeft}>
                        <View style={[styles.menuItemIcon, { backgroundColor: "rgba(239, 68, 68, 0.05)", width: 28, height: 28 }]}>
                          <Ionicons name="warning-outline" size={12} color="#ef4444" opacity={0.5} />
                        </View>
                        <Text style={[styles.editActionItemText, { color: "#ef4444", fontSize: 12, opacity: 0.6 }]}>Danger Zone</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={12} color="#ef4444" opacity={0.4} />
                    </Pressable>
                  </>
                )}

                {editProfileView === "changeEmail" && (
                  <>
                    <Pressable
                      style={styles.editBackButton}
                      onPress={() => {
                        lightHaptic();
                        setEditProfileMessage(null);
                        setEditProfileView("main");
                      }}
                    >
                      <Ionicons name="arrow-back" size={18} color="#64748b" />
                      <Text style={styles.editBackButtonText}>Back</Text>
                    </Pressable>

                    <Text style={styles.editFieldLabel}>Current email</Text>
                    <Text style={styles.editFieldCurrent}>{user?.email}</Text>

                    <Text style={styles.editFieldLabel}>New email</Text>
                    <TextInput
                      style={styles.editInput}
                      value={newEmail}
                      onChangeText={setNewEmail}
                      placeholder="Enter new email address"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />

                    <Pressable
                      style={({ pressed }) => [
                        styles.editPrimaryButton,
                        pressed && styles.menuItemPressed,
                        editProfileLoading && styles.buttonDisabled,
                      ]}
                      disabled={editProfileLoading}
                      onPress={handleChangeEmail}
                    >
                      {editProfileLoading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.editPrimaryButtonText}>Update Email</Text>
                      )}
                    </Pressable>
                  </>
                )}

                {editProfileView === "changePassword" && (
                  <>
                    <Pressable
                      style={styles.editBackButton}
                      onPress={() => {
                        lightHaptic();
                        setEditProfileMessage(null);
                        setEditProfileView("main");
                      }}
                    >
                      <Ionicons name="arrow-back" size={18} color="#64748b" />
                      <Text style={styles.editBackButtonText}>Back</Text>
                    </Pressable>

                    <Text style={styles.editFieldLabel}>New password</Text>
                    <TextInput
                      style={styles.editInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry
                    />

                    <Text style={styles.editFieldLabel}>Confirm password</Text>
                    <TextInput
                      style={styles.editInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry
                    />

                    <Pressable
                      style={({ pressed }) => [
                        styles.editPrimaryButton,
                        pressed && styles.menuItemPressed,
                        editProfileLoading && styles.buttonDisabled,
                      ]}
                      disabled={editProfileLoading}
                      onPress={handleChangePassword}
                    >
                      {editProfileLoading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.editPrimaryButtonText}>Update Password</Text>
                      )}
                    </Pressable>
                  </>
                )}

                {editProfileView === "reminders" && (
                  <>
                    <Pressable
                      style={styles.editBackButton}
                      onPress={() => {
                        lightHaptic();
                        setEditProfileMessage(null);
                        setEditProfileView("main");
                      }}
                    >
                      <Ionicons name="arrow-back" size={18} color="#64748b" />
                      <Text style={styles.editBackButtonText}>Back</Text>
                    </Pressable>

                    <View style={styles.reminderSummaryCard}>
                      <Text style={styles.reminderSummaryTitle}>Reminder Status</Text>
                      <Text style={styles.reminderSummaryText}>
                        Daily reminder: {reminderEnabled ? "On" : "Off"}
                      </Text>
                      <Text style={styles.reminderSummarySubtext}>
                        Daily: {formatTimeForDisplay(reminderTimeInput)} • Streak: 11:30 PM
                      </Text>
                    </View>

                    <Text style={styles.editFieldLabel}>Reminder time (24-hour)</Text>
                    <TextInput
                      style={styles.editInput}
                      value={reminderTimeInput}
                      onChangeText={(value) => {
                        setEditProfileMessage(null);
                        setReminderTimeInput(sanitizeReminderInput(value));
                      }}
                      placeholder="HH:MM"
                      placeholderTextColor="#94a3b8"
                      keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
                      autoCapitalize="none"
                      maxLength={5}
                    />

                    <View style={styles.reminderPresetRow}>
                      {REMINDER_PRESET_TIMES.map((time) => {
                        const isSelected = reminderTimeInput === time;
                        return (
                          <Pressable
                            key={time}
                            style={({ pressed }) => [
                              styles.reminderPresetButton,
                              isSelected && styles.reminderPresetButtonSelected,
                              pressed && styles.menuItemPressed,
                            ]}
                            onPress={() => {
                              lightHaptic();
                              setEditProfileMessage(null);
                              setReminderTimeInput(time);
                            }}
                          >
                            <Text
                              style={[
                                styles.reminderPresetText,
                                isSelected && styles.reminderPresetTextSelected,
                              ]}
                            >
                              {formatTimeForDisplay(time)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    {reminderSnapshot && (
                      <View style={styles.reminderDebugCard}>
                        <Text style={styles.reminderDebugTitle}>Verification</Text>
                        <Text style={styles.reminderDebugItem}>
                          Permission: {reminderSnapshot.permissionGranted ? "Granted" : "Not granted"}
                        </Text>
                        <Text style={styles.reminderDebugItem}>
                          Daily scheduled: {reminderSnapshot.dailyReminderScheduled ? "Yes" : "No"}
                        </Text>
                        <Text style={styles.reminderDebugItem}>
                          Streak scheduled: {reminderSnapshot.streakReminderScheduled ? "Yes" : "No"}
                        </Text>
                        <Text style={styles.reminderDebugItem}>
                          Total scheduled notifications: {reminderSnapshot.scheduledCount}
                        </Text>
                      </View>
                    )}

                    <Pressable
                      style={({ pressed }) => [
                        styles.editPrimaryButton,
                        pressed && styles.menuItemPressed,
                        editProfileLoading && styles.buttonDisabled,
                      ]}
                      disabled={editProfileLoading}
                      onPress={handleSaveReminderSettings}
                    >
                      {editProfileLoading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.editPrimaryButtonText}>Save Reminder Settings</Text>
                      )}
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.reminderSecondaryButton,
                        pressed && styles.menuItemPressed,
                        editProfileLoading && styles.buttonDisabled,
                      ]}
                      disabled={editProfileLoading}
                      onPress={handleDisableReminders}
                    >
                      <Text style={styles.reminderSecondaryButtonText}>Turn Off Reminders</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.reminderGhostButton,
                        pressed && styles.menuItemPressed,
                        editProfileLoading && styles.buttonDisabled,
                      ]}
                      disabled={editProfileLoading}
                      onPress={handleVerifyReminderSetup}
                    >
                      <Text style={styles.reminderGhostButtonText}>Verify Reminder Setup</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.reminderGhostButton,
                        pressed && styles.menuItemPressed,
                        editProfileLoading && styles.buttonDisabled,
                      ]}
                      disabled={editProfileLoading}
                      onPress={handleSendTestReminder}
                    >
                      <Text style={styles.reminderGhostButtonText}>Send 15s Test Reminder</Text>
                    </Pressable>

                    {reminderSnapshot && !reminderSnapshot.permissionGranted && Platform.OS !== "web" && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.reminderGhostButton,
                          pressed && styles.menuItemPressed,
                          editProfileLoading && styles.buttonDisabled,
                        ]}
                        disabled={editProfileLoading}
                        onPress={() => {
                          Linking.openSettings().catch((error) => {
                            console.error("Failed to open settings:", error);
                          });
                        }}
                      >
                        <Text style={styles.reminderGhostButtonText}>Open Notification Settings</Text>
                      </Pressable>
                    )}
                  </>
                )}

                {editProfileView === "dangerZone" && (
                  <>
                    <Pressable
                      style={styles.editBackButton}
                      onPress={() => {
                        lightHaptic();
                        setEditProfileMessage(null);
                        setEditProfileView("main");
                      }}
                    >
                      <Ionicons name="arrow-back" size={18} color="#64748b" />
                      <Text style={styles.editBackButtonText}>Back</Text>
                    </Pressable>

                    <View style={styles.dangerZonePanel}>
                      <Ionicons name="warning" size={28} color="#ef4444" />
                      <Text style={styles.dangerZonePanelTitle}>Delete account permanently</Text>
                      <Text style={styles.dangerZonePanelSubtitle}>
                        Type DELETE to unlock account deletion.
                      </Text>
                    </View>

                    <Text style={styles.editFieldLabel}>Confirm with DELETE</Text>
                    <TextInput
                      style={[styles.editInput, styles.editDangerInput]}
                      value={deleteConfirmText}
                      onChangeText={setDeleteConfirmText}
                      placeholder="DELETE"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="characters"
                    />

                    <Pressable
                      style={({ pressed }) => [
                        styles.editDangerButton,
                        pressed && styles.menuItemPressed,
                      ]}
                      onPress={handleDangerZoneDelete}
                    >
                      <Text style={styles.editDangerButtonText}>Delete Account</Text>
                    </Pressable>
                  </>
                )}

                {editProfileMessage && (
                  <View
                    style={[
                      styles.editMessageBox,
                      editProfileMessage.type === "error"
                        ? styles.editMessageBoxError
                        : styles.editMessageBoxSuccess,
                    ]}
                  >
                    <Text
                      style={[
                        styles.editMessageText,
                        editProfileMessage.type === "error"
                          ? styles.editMessageTextError
                          : styles.editMessageTextSuccess,
                      ]}
                    >
                      {editProfileMessage.text}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  loadingBird: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },
  loadingSpinner: {
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 20 : 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  headerTextBlock: {
    flex: 1,
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
  headerBird: {
    width: 72,
    height: 72,
    marginLeft: 8,
    opacity: 0.92,
    transform: [{ scaleX: -1 }],
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
  userEmailHint: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
    marginTop: 6,
    maxWidth: "90%",
  },
  editProfileTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ecfdf5",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editProfileTriggerText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10b981",
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
    alignItems: "center",
    marginBottom: 8,
  },
  presenceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 16,
  },
  presenceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  presenceLottie: {
    width: 44,
    height: 44,
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
  guestCtaWrap: {
    borderRadius: 18,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#4A7A49",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  guestCtaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  guestCtaIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  guestCtaTextWrap: {
    flex: 1,
  },
  guestCtaTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  guestCtaSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  guestCtaArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
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
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  editModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  editModalWrap: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    zIndex: 1,
  },
  editModalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  editModalHandleTouch: {
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  editModalHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
    alignSelf: "center",
  },
  editModalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  editModalCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  editModalContent: {
    flex: 1,
  },
  editModalContentContainer: {
    padding: 20,
    gap: 12,
    paddingBottom: 24,
  },
  editProfileIdentity: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 6,
  },
  editProfileIdentityIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  editProfileIdentityLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  editProfileIdentityEmail: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginTop: 4,
  },
  editActionItem: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editActionDanger: {
    borderColor: "rgba(239, 68, 68, 0.25)",
    backgroundColor: "#fff7f7",
  },
  editActionItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editActionItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  editBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
    alignSelf: "flex-start",
  },
  editBackButtonText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
  editFieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 6,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  editFieldCurrent: {
    fontSize: 15,
    color: "#334155",
    marginBottom: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: "#dbe2ea",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  reminderSummaryCard: {
    backgroundColor: "#ecfdf5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    padding: 14,
    gap: 4,
  },
  reminderSummaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
  },
  reminderSummaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#166534",
  },
  reminderSummarySubtext: {
    fontSize: 12,
    color: "#166534",
  },
  reminderPresetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  reminderPresetButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  reminderPresetButtonSelected: {
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
  },
  reminderPresetText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  reminderPresetTextSelected: {
    color: "#047857",
  },
  reminderDebugCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe2ea",
    backgroundColor: "#f8fafc",
    padding: 12,
    gap: 2,
  },
  reminderDebugTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  reminderDebugItem: {
    fontSize: 12,
    color: "#475569",
  },
  editDangerInput: {
    borderColor: "#fecaca",
    backgroundColor: "#fffaf9",
  },
  editPrimaryButton: {
    marginTop: 10,
    backgroundColor: "#10b981",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  editPrimaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  reminderSecondaryButton: {
    marginTop: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fca5a5",
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderSecondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#b91c1c",
  },
  reminderGhostButton: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  reminderGhostButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  editDangerButton: {
    marginTop: 10,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  editDangerButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  dangerZonePanel: {
    backgroundColor: "#fff1f2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecdd3",
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  dangerZonePanelTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#b91c1c",
  },
  dangerZonePanelSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#b91c1c",
    textAlign: "center",
    lineHeight: 18,
  },
  editMessageBox: {
    marginTop: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  editMessageBoxError: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  editMessageBoxSuccess: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  editMessageText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  editMessageTextError: {
    color: "#b91c1c",
  },
  editMessageTextSuccess: {
    color: "#166534",
  },
});
