import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  TextInput,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/lib/AuthContext";
import { EtherealBackground } from "../../src/components/EtherealBackground";
import { ProfileModal } from "../../src/components/ProfileModal";
import { GuidanceHistoryModal } from "../../src/components/GuidanceHistoryModal";
import { BannerAdComponent } from "../../src/components/BannerAdComponent";
import { PremiumPopup } from "../../src/components/PremiumPopup";
import { usePremium } from "../../src/lib/PremiumContext";
import { mediumHaptic, lightHaptic } from "../../src/lib/haptics";

const trustIndicators = [
  { icon: "sparkles" as const, text: "Biblical wisdom" },
  { icon: "leaf" as const, text: "Personalized guidance" },
  { icon: "lock-closed" as const, text: "Private & secure" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { shouldShowPopup, markPopupShown } = usePremium();
  const [signingOut, setSigningOut] = useState(false);
  const [query, setQuery] = useState("");
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [premiumPopupVisible, setPremiumPopupVisible] = useState(false);

  // Check if we should show premium popup
  useEffect(() => {
    const checkPopup = async () => {
      const shouldShow = await shouldShowPopup();
      if (shouldShow) {
        // Delay popup slightly for better UX
        setTimeout(() => {
          setPremiumPopupVisible(true);
        }, 2000);
      }
    };
    checkPopup();
  }, [shouldShowPopup]);

  const handleSearch = () => {
    if (query.trim()) {
      mediumHaptic();
      router.push({
        pathname: "/guidance",
        params: { q: query.trim() },
      });
    }
  };

  const doSignOut = async () => {
    try {
      setSigningOut(true);
      console.log("[SignOut] Starting sign out...");
      
      await signOut();
      console.log("[SignOut] signOut complete");
      
      // Force page reload on web to clear React state
      if (Platform.OS === "web") {
        window.location.href = "/";
        return;
      }
      
      router.replace("/(auth)");
    } catch (e) {
      console.error("[SignOut] Error:", e);
      // Force reload on web even on error
      if (Platform.OS === "web") {
        window.location.href = "/";
      } else {
        router.replace("/(auth)");
      }
    } finally {
      setSigningOut(false);
    }
  };

  const handleSignOut = async () => {
    // On web, use confirm dialog; on native use Alert
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
          {
            text: "Sign Out",
            style: "destructive",
            onPress: doSignOut,
          },
        ]
      );
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Ethereal background with leaves */}
      <EtherealBackground />

      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/NewLogo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>
              <Text style={styles.logoTextBold}>Guidance</Text>
              <Text style={styles.logoTextLight}> from Scripture</Text>
            </Text>
          </View>
          <Pressable 
            style={styles.profileButton} 
            onPress={() => {
              lightHaptic();
              setProfileModalVisible(true);
            }}
          >
            <Ionicons name="person-circle-outline" size={28} color="#10b981" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Heading */}
            <View style={styles.headingContainer}>
              <Text style={styles.heading}>
                What do you need{"\n"}
                <Text style={styles.headingGradient}>guidance</Text>
                {" "}on today?
              </Text>
              <Text style={styles.subheading}>
                Share what's on your heart, and receive personalized wisdom from Scripture.
              </Text>
            </View>

            {/* Glass card with input */}
            <View style={styles.glassCard}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="I feel..."
                  placeholderTextColor="#9ca3af"
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
              </View>
              <Pressable
                style={[styles.submitButton, !query.trim() && styles.submitButtonDisabled]}
                onPress={handleSearch}
                disabled={!query.trim()}
              >
                <Text style={styles.submitButtonText}>Get Guidance</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Banner Ad - above trust indicators */}
        <BannerAdComponent style={styles.bannerAd} />

        {/* Trust indicators - horizontal */}
        <View style={styles.trustContainer}>
          {trustIndicators.map((item, index) => (
            <View key={index} style={styles.trustItem}>
              <Ionicons name={item.icon} size={14} color="#6b7280" />
              <Text style={styles.trustText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>

      {/* Profile Modal */}
      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        onSignOut={handleSignOut}
        onViewHistory={() => {
          setProfileModalVisible(false);
          setHistoryModalVisible(true);
        }}
      />

      {/* Guidance History Modal */}
      <GuidanceHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
      />

      {/* Premium Subscription Popup */}
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
    paddingTop: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  logoText: {
    fontSize: 14,
  },
  logoTextBold: {
    fontWeight: "600",
    color: "#0f172a",
  },
  logoTextLight: {
    fontWeight: "400",
    color: "#64748b",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  streakLottieContainer: {
    width: 20,
    height: 20,
  },
  streakLottie: {
    width: 20,
    height: 20,
  },
  streakCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#d97706",
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)",
      } as any,
    }),
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: -64,
  },
  headingContainer: {
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#0f172a",
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  headingGradient: {
    color: "#10b981",
    fontStyle: "italic",
    fontWeight: "500",
  },
  subheading: {
    fontSize: 14,
    textAlign: "center",
    color: "#94a3b8",
    lineHeight: 22,
    maxWidth: 280,
    fontWeight: "300",
  },
  glassCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 32,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        backdropFilter: "blur(12px)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      } as any,
    }),
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    fontSize: 18,
    color: "#0f172a",
    fontWeight: "300",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 6px 20px rgba(16, 185, 129, 0.2)",
      } as any,
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
  },
  bannerAd: {
    marginBottom: 8,
  },
  trustContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    paddingVertical: 32,
    opacity: 0.4,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trustText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
