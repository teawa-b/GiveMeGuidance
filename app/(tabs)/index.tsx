import React, { useState, useEffect, useCallback } from "react";
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
import { useAds } from "../../src/lib/AdsContext";
import { mediumHaptic, lightHaptic } from "../../src/lib/haptics";

// Topic categories for quick selection
const topicCategories = [
  { id: "anxiety", label: "Anxiety", icon: "head-question-outline" as const },
  { id: "relationships", label: "Relationships", icon: "heart-outline" as const },
  { id: "career", label: "Career", icon: "briefcase-outline" as const },
  { id: "faith", label: "Faith", icon: "star-four-points-outline" as const },
  { id: "peace", label: "Peace", icon: "scale-balance" as const },
  { id: "purpose", label: "Purpose", icon: "meditation" as const },
];

const topicPrompts: Record<string, string> = {
  anxiety: "I'm feeling anxious and need peace",
  relationships: "I need guidance for my relationships",
  career: "I need direction for my career",
  faith: "I want to strengthen my faith",
  peace: "I'm searching for inner peace",
  purpose: "I'm looking for my purpose in life",
};

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { shouldShowPopup, markPopupShown, isPremium } = usePremium();
  const { maybeShowInterstitialAd } = useAds();
  const [signingOut, setSigningOut] = useState(false);
  const [query, setQuery] = useState("");
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [premiumPopupVisible, setPremiumPopupVisible] = useState(false);

  // Clear search query when screen comes into focus (e.g., when navigating back)
  useFocusEffect(
    useCallback(() => {
      setQuery("");
    }, [])
  );

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

  const handleTopicPress = (topicId: string) => {
    lightHaptic();
    const prompt = topicPrompts[topicId];
    setQuery(prompt);
  };

  const handleSearch = async () => {
    if (query.trim()) {
      mediumHaptic();
      
      // Show interstitial ad 1 in 4 times for non-premium users
      // The ad must be dismissed before continuing to guidance
      if (!isPremium) {
        await maybeShowInterstitialAd(0.25); // 25% chance = 1 in 4 times
      }
      
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
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Heading */}
            <View style={styles.headingContainer}>
              <Text style={styles.heading}>
                Explore Paths to{"\n"}
                <Text style={styles.headingGradient}>Clarity</Text>
              </Text>
              <Text style={styles.subheading}>
                Select a topic that resonates with your spirit, or freely express your feelings below.
              </Text>
            </View>

            {/* Topic Grid */}
            <View style={styles.topicGrid}>
              {topicCategories.map((topic) => (
                <Pressable
                  key={topic.id}
                  style={({ pressed }) => [
                    styles.topicCard,
                    pressed && styles.topicCardPressed,
                  ]}
                  onPress={() => handleTopicPress(topic.id)}
                >
                  <MaterialCommunityIcons name={topic.icon} size={24} color="#10b981" />
                  <Text style={styles.topicLabel}>{topic.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Banner Ad - placed between topics and input */}
            <BannerAdComponent style={styles.bannerAd} />

            {/* Glass card with input */}
            <View style={styles.glassCard}>
              <Text style={styles.cantFindLabel}>Can't find your topic?</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
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

          </ScrollView>
        </KeyboardAvoidingView>
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
        onViewBookmarks={() => {
          setProfileModalVisible(false);
          router.push("/(tabs)/bookmarks");
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 12 : 16,
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
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 1,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)",
      } as any,
    }),
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: "center",
  },
  headingContainer: {
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#0f172a",
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  headingGradient: {
    color: "#10b981",
    fontStyle: "italic",
    fontWeight: "500",
  },
  subheading: {
    fontSize: 13,
    textAlign: "center",
    color: "#94a3b8",
    lineHeight: 18,
    maxWidth: 320,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  topicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    maxWidth: 380,
    gap: 8,
    marginBottom: 16,
  },
  topicCard: {
    width: "48%",
    flexGrow: 1,
    flexBasis: "45%",
    borderRadius: 14,
    padding: 12,
    alignItems: "flex-start",
    gap: 6,
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
        elevation: 2,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      } as any,
    }),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  topicCardPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  topicLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  glassCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 4,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 24px rgba(16, 185, 129, 0.08)",
      } as any,
    }),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    marginBottom: 16,
  },
  cantFindLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(248, 250, 252, 0.8)",
      },
      android: {
        backgroundColor: "#f8fafc",
      },
      web: {
        backgroundColor: "rgba(248, 250, 252, 0.8)",
      },
    }),
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "400",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10b981",
    paddingVertical: 12,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 6px 20px rgba(16, 185, 129, 0.25)",
      } as any,
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  bannerAd: {
    width: "100%",
    maxWidth: 380,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
});
