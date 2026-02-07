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
} from "react-native";
import { useRouter } from "expo-router";
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

type EditProfileView = "main" | "changeEmail" | "changePassword" | "dangerZone";
const profileBird = require("../../assets/mascot/bird-pointing-right.png");
const loadingBird = require("../../assets/mascot/bird-reading.png");

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPremium, restorePurchases, presentCustomerCenter } = usePremium();
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
  const editModalTranslateY = useRef(new Animated.Value(120)).current;
  const editModalDragY = useRef(new Animated.Value(0)).current;
  const isClosingModalRef = useRef(false);

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
                      style={({ pressed }) => [
                        styles.editActionItem,
                        styles.editActionDanger,
                        pressed && styles.menuItemPressed,
                      ]}
                      onPress={() => {
                        warningHaptic();
                        setEditProfileMessage(null);
                        setEditProfileView("dangerZone");
                      }}
                      >
                        <View style={styles.editActionItemLeft}>
                          <View style={[styles.menuItemIcon, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                            <Ionicons name="warning-outline" size={18} color="#ef4444" />
                          </View>
                          <Text style={[styles.editActionItemText, { color: "#ef4444" }]}>Danger Zone</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#ef4444" />
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
