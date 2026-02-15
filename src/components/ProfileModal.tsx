import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../lib/AuthContext";
import { usePremium } from "../lib/PremiumContext";
import { PremiumPopup } from "./PremiumPopup";
import { supabase } from "../lib/supabase";
import { getCurrentStreakDisplay } from "../services/streak";
import { deleteMyAccount } from "../services/account";
import { lightHaptic, mediumHaptic, warningHaptic, successHaptic } from "../lib/haptics";

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSignOut: () => void;
  onViewHistory?: () => void;
  onViewBookmarks?: () => void;
}

type ModalView = "main" | "changeEmail" | "changePassword" | "deleteAccount";

export function ProfileModal({ visible, onClose, onSignOut, onViewHistory, onViewBookmarks }: ProfileModalProps) {
  const { user } = useAuth();
  const { isPremium, restorePurchases, presentCustomerCenter } = usePremium();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const [currentView, setCurrentView] = useState<ModalView>("main");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [premiumPopupVisible, setPremiumPopupVisible] = useState(false);
  
  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Streak data from user_streaks table
  const [streakData, setStreakData] = useState<{
    currentStreak: number;
    longestStreak: number;
    isActiveToday: boolean;
  }>({
    currentStreak: 0,
    longestStreak: 0,
    isActiveToday: false,
  });

  const fetchStreakData = useCallback(async () => {
    try {
      const data = await getCurrentStreakDisplay();
      setStreakData(data);
    } catch (error) {
      console.error("Error fetching streak data:", error);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      setCurrentView("main");
      setMessage(null);
      fetchStreakData();
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
      setCurrentView("main");
      setMessage(null);
      resetForms();
      onClose();
    });
  };

  const resetForms = () => {
    setNewEmail("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setDeleteConfirmText("");
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      setMessage({ type: "error", text: "Please enter a new email address" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      
      setMessage({ 
        type: "success", 
        text: "Confirmation email sent! Please check your inbox." 
      });
      setNewEmail("");
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update email" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setMessage({ type: "success", text: "Password updated successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to update password" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setMessage({ type: "error", text: "Please type DELETE to confirm" });
      return;
    }

    const confirmDelete = async () => {
      setLoading(true);
      setMessage(null);

      try {
        await deleteMyAccount();
        successHaptic();
        await onSignOut();
      } catch (error: any) {
        setMessage({
          type: "error",
          text: error?.message || "Failed to delete account. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you absolutely sure? This action cannot be undone.")) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        "Delete Account",
        "Are you absolutely sure? This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: confirmDelete },
        ]
      );
    }
  };

  const renderMainView = () => (
    <>
      {/* User Info */}
      <View style={styles.userSection}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={32} color="#10b981" />
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user?.email || "Guest"}
        </Text>
      </View>

      {/* Spiritual Presence Card (non-gamified) */}
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <View style={styles.streakIconContainer}>
            <Ionicons name="flame" size={30} color="#f59e0b" />
          </View>
        </View>
        <Text style={styles.streakTitle}>Your Journey</Text>
        
        <View style={styles.streakStats}>
          <View style={styles.streakStatItem}>
            <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakStatItem}>
            <Text style={styles.streakNumber}>{streakData.longestStreak}</Text>
            <Text style={styles.streakLabel}>Longest Streak</Text>
          </View>
        </View>
        
        {streakData.isActiveToday && (
          <View style={styles.streakMotivationContainer}>
            <Text style={styles.streakMotivation}>🌿 Active today</Text>
          </View>
        )}
        {!streakData.isActiveToday && streakData.longestStreak > 0 && (
          <View style={styles.streakMotivationContainer}>
            <Text style={styles.streakMotivation}>Ready when you are</Text>
          </View>
        )}
        {streakData.longestStreak === 0 && (
          <View style={styles.streakMotivationContainer}>
            <Text style={styles.streakMotivation}>Begin your journey</Text>
          </View>
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Pressable 
          style={styles.menuItem}
          onPress={() => {
            lightHaptic();
            onViewHistory?.();
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="time-outline" size={22} color="#10b981" />
            <Text style={[styles.menuItemText, styles.menuItemHighlight]}>View Your Path</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#10b981" />
        </Pressable>

        <View style={styles.menuDivider} />

        <Pressable
          style={styles.menuItem}
          onPress={() => {
            lightHaptic();
            onViewBookmarks?.();
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="bookmark-outline" size={22} color="#10b981" />
            <Text style={[styles.menuItemText, styles.menuItemHighlight]}>Saved Bookmarks</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#10b981" />
        </Pressable>

        <View style={styles.menuDivider} />

        {/* Premium / Support Section */}
        {isPremium ? (
          <>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="heart" size={22} color="#10b981" />
                <Text style={[styles.menuItemText, styles.menuItemHighlight]}>Premium Supporter</Text>
              </View>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>ACTIVE</Text>
              </View>
            </View>
            
            <Pressable 
              style={styles.menuItem}
              onPress={() => {
                lightHaptic();
                presentCustomerCenter();
              }}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="settings-outline" size={22} color="#64748b" />
                <Text style={styles.menuItemText}>Manage Subscription</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </Pressable>
          </>
        ) : (
          <Pressable 
            style={styles.menuItem}
            onPress={() => {
              lightHaptic();
              setPremiumPopupVisible(true);
            }}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="heart-outline" size={22} color="#f59e0b" />
              <Text style={[styles.menuItemText, styles.menuItemPremium]}>Support the App</Text>
            </View>
            <View style={styles.supportBadge}>
              <Text style={styles.supportBadgeText}>Remove Ads</Text>
            </View>
          </Pressable>
        )}

        <View style={styles.menuDivider} />

        <Pressable 
          style={styles.menuItem}
          onPress={() => {
            lightHaptic();
            setMessage(null);
            setCurrentView("changeEmail");
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="mail-outline" size={22} color="#64748b" />
            <Text style={styles.menuItemText}>Change Email</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </Pressable>

        <Pressable 
          style={styles.menuItem}
          onPress={() => {
            lightHaptic();
            setMessage(null);
            setCurrentView("changePassword");
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="lock-closed-outline" size={22} color="#64748b" />
            <Text style={styles.menuItemText}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </Pressable>

        <View style={styles.menuDivider} />

        <Pressable 
          style={styles.menuItem}
          onPress={() => {
            warningHaptic();
            setMessage(null);
            setCurrentView("deleteAccount");
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
            <Text style={[styles.menuItemText, styles.menuItemDanger]}>Delete Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
        </Pressable>
      </View>

      {/* Sign Out Button */}
      <Pressable style={styles.signOutButton} onPress={() => {
        warningHaptic();
        onSignOut();
      }}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </>
  );

  const renderChangeEmailView = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.formHeader}>
        <Pressable style={styles.backButton} onPress={() => setCurrentView("main")}>
          <Ionicons name="arrow-back" size={24} color="#64748b" />
        </Pressable>
        <Text style={styles.formTitle}>Change Email</Text>
      </View>

      <Text style={styles.formDescription}>
        Enter your new email address. You'll receive a confirmation link.
      </Text>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Current Email</Text>
        <Text style={styles.currentValue}>{user?.email}</Text>
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>New Email</Text>
        <TextInput
          style={styles.textInput}
          value={newEmail}
          onChangeText={setNewEmail}
          {...{["place" + "holder"]: "Enter new email"}}
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </View>

      {message && (
        <View style={[styles.messageBox, message.type === "error" ? styles.errorBox : styles.successBox]}>
          <Text style={[styles.messageText, message.type === "error" ? styles.errorText : styles.successText]}>
            {message.text}
          </Text>
        </View>
      )}

      <Pressable 
        style={[styles.primaryButton, loading && styles.buttonDisabled]} 
        onPress={handleChangeEmail}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Update Email</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );

  const renderChangePasswordView = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.formHeader}>
        <Pressable style={styles.backButton} onPress={() => setCurrentView("main")}>
          <Ionicons name="arrow-back" size={24} color="#64748b" />
        </Pressable>
        <Text style={styles.formTitle}>Change Password</Text>
      </View>

      <Text style={styles.formDescription}>
        Enter a new password for your account.
      </Text>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>New Password</Text>
        <TextInput
          style={styles.textInput}
          value={newPassword}
          onChangeText={setNewPassword}
          {...{["place" + "holder"]: "Enter new password"}}
          placeholderTextColor="#9ca3af"
          secureTextEntry
        />
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Confirm Password</Text>
        <TextInput
          style={styles.textInput}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          {...{["place" + "holder"]: "Confirm new password"}}
          placeholderTextColor="#9ca3af"
          secureTextEntry
        />
      </View>

      {message && (
        <View style={[styles.messageBox, message.type === "error" ? styles.errorBox : styles.successBox]}>
          <Text style={[styles.messageText, message.type === "error" ? styles.errorText : styles.successText]}>
            {message.text}
          </Text>
        </View>
      )}

      <Pressable 
        style={[styles.primaryButton, loading && styles.buttonDisabled]} 
        onPress={handleChangePassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryButtonText}>Update Password</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );

  const renderDeleteAccountView = () => (
    <View>
      <View style={styles.formHeader}>
        <Pressable style={styles.backButton} onPress={() => setCurrentView("main")}>
          <Ionicons name="arrow-back" size={24} color="#64748b" />
        </Pressable>
        <Text style={styles.formTitle}>Delete Account</Text>
      </View>

      <View style={styles.dangerZone}>
        <Ionicons name="warning" size={48} color="#ef4444" />
        <Text style={styles.dangerTitle}>This action is permanent</Text>
        <Text style={styles.dangerDescription}>
          Deleting your account will permanently remove all your data, including saved guidance, bookmarks, and chat history.
        </Text>
      </View>

      <View style={styles.formField}>
        <Text style={styles.fieldLabel}>Type DELETE to confirm</Text>
        <TextInput
          style={[styles.textInput, styles.dangerInput]}
          value={deleteConfirmText}
          onChangeText={setDeleteConfirmText}
          {...{["place" + "holder"]: "DELETE"}}
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
        />
      </View>

      {message && (
        <View style={[styles.messageBox, message.type === "error" ? styles.errorBox : styles.successBox]}>
          <Text style={[styles.messageText, message.type === "error" ? styles.errorText : styles.successText]}>
            {message.text}
          </Text>
        </View>
      )}

      <Pressable 
        style={[styles.dangerButton, loading && styles.buttonDisabled]} 
        onPress={handleDeleteAccount}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.dangerButtonText}>Delete My Account</Text>
        )}
      </Pressable>
    </View>
  );

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Pressable style={styles.overlayTouch} onPress={handleClose} />
          
          <Animated.View 
            style={[
              styles.modalContainer,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            {/* Handle bar */}
            <View style={styles.handleBar} />
            
            {/* Close button */}
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>

            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {currentView === "main" && renderMainView()}
              {currentView === "changeEmail" && renderChangeEmailView()}
              {currentView === "changePassword" && renderChangePasswordView()}
              {currentView === "deleteAccount" && renderDeleteAccountView()}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Premium Popup */}
      <PremiumPopup
        visible={premiumPopupVisible}
        onClose={() => setPremiumPopupVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  overlayTouch: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      default: {
        elevation: 20,
      },
      web: {
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.15)",
      } as any,
    }),
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },
  userSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fafaf6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
  },
  streakCard: {
    backgroundColor: "#fffbeb",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#fef3c7",
  },
  streakHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
    textAlign: "center",
    marginBottom: 16,
  },
  streakIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
  },
  streakLottie: {
    width: 44,
    height: 44,
  },
  streakStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  streakStatItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  streakDivider: {
    width: 1,
    height: 50,
    backgroundColor: "#fde68a",
    marginHorizontal: 8,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: "#f59e0b",
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#92400e",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: "center",
  },
  streakMotivationContainer: {
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#fde68a",
  },
  streakMotivation: {
    fontSize: 14,
    fontWeight: "600",
    color: "#b45309",
  },
  menuSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#334155",
  },
  menuItemHighlight: {
    color: "#059669",
    fontWeight: "600",
  },
  menuItemDanger: {
    color: "#ef4444",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 16,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    marginBottom: 24,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
  // Form styles
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  formDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 24,
  },
  formField: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  currentValue: {
    fontSize: 16,
    color: "#94a3b8",
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dangerInput: {
    borderColor: "#fecaca",
  },
  messageBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
  },
  successBox: {
    backgroundColor: "#fafaf6",
  },
  messageText: {
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    color: "#dc2626",
  },
  successText: {
    color: "#16a34a",
  },
  primaryButton: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dangerZone: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#dc2626",
    marginTop: 12,
    marginBottom: 8,
  },
  dangerDescription: {
    fontSize: 14,
    color: "#991b1b",
    textAlign: "center",
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  menuItemPremium: {
    color: "#f59e0b",
    fontWeight: "500",
  },
  premiumBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  supportBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  supportBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#d97706",
  },
});

