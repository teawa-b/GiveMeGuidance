import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  StatusBar,
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
import { playAppOpenedSound } from "../../src/lib/sounds";

const suggestionPrompts = [
  // Anxiety & Worry
  "I feel anxious about the future",
  "I'm worried about tomorrow",
  "My mind won't stop racing",
  "I can't stop overthinking",
  "I feel overwhelmed by life",
  
  // Strength & Courage
  "I need strength for today",
  "I feel weak and tired",
  "I need courage to face this",
  "I'm running out of energy",
  "I need to be brave today",
  
  // Peace & Calm
  "Help me find peace in chaos",
  "I want inner peace",
  "My heart feels restless",
  "I need calm in the storm",
  "I want to feel still inside",
  
  // Discouragement & Hope
  "I feel weak and discouraged",
  "I've lost my motivation",
  "I need hope right now",
  "I feel like giving up",
  "I need encouragement today",
  
  // Direction & Purpose
  "I want clarity on my path",
  "I feel lost in life",
  "I don't know what to do",
  "I need direction for my future",
  "I'm searching for purpose",
  
  // Loneliness & Connection
  "I feel so alone",
  "I need to feel loved",
  "I'm struggling with loneliness",
  "I feel disconnected",
  "I need comfort today",
  
  // Forgiveness & Guilt
  "I need to forgive someone",
  "I'm carrying guilt",
  "I need to let go of the past",
  "I feel ashamed of myself",
  "I need a fresh start",
  
  // Faith & Doubt
  "My faith feels weak",
  "I'm struggling to trust God",
  "I have so many doubts",
  "I want to believe again",
  "I need to grow spiritually",
  
  // Relationships
  "I'm struggling in my relationship",
  "I need patience with others",
  "I want to be a better friend",
  "I need wisdom for my family",
  "I'm dealing with conflict",
  
  // Grief & Loss
  "I'm grieving a loss",
  "My heart is broken",
  "I miss someone deeply",
  "I need healing from pain",
  "I'm processing a big change",
  
  // Gratitude & Joy
  "I want to be more grateful",
  "I've lost my joy",
  "I want to appreciate life more",
  "I need to count my blessings",
  "I want to find happiness",
  
  // Work & Stress
  "I'm stressed about work",
  "I feel burnt out",
  "I need balance in life",
  "I'm facing a big decision",
  "I need wisdom for my career",
  
  // Self-Worth
  "I don't feel good enough",
  "I'm struggling with self-doubt",
  "I need to love myself more",
  "I feel like a failure",
  "I want to see my worth",
  
  // Fear
  "I'm afraid of what's ahead",
  "Fear is holding me back",
  "I need to overcome my fears",
  "I'm scared to take a step",
  "I want freedom from fear",
  
  // Patience & Waiting
  "I'm tired of waiting",
  "I need patience right now",
  "I'm struggling with timing",
  "I want to trust the process",
  "I need to slow down",
];

// Shuffle array helper function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const suggestionChips = [
  { text: "I feel lost", icon: "compass-outline" as const },
  { text: "I need hope", icon: "sunny-outline" as const },
  { text: "I'm anxious", icon: "leaf-outline" as const },
  { text: "I want peace", icon: "water-outline" as const },
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

  // Shuffle prompts on mount for variety each time app opens
  const [shuffledPrompts] = useState(() => shuffleArray(suggestionPrompts));
  const [suggestionIndex, setSuggestionIndex] = useState(() => 
    Math.floor(Math.random() * suggestionPrompts.length)
  );
  const suggestionFade = useRef(new Animated.Value(1)).current;

  // Play app opened sound on mount
  useEffect(() => {
    playAppOpenedSound();
  }, []);

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

  useEffect(() => {
    const cycleSuggestion = () => {
      Animated.timing(suggestionFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSuggestionIndex((prev) => (prev + 1) % shuffledPrompts.length);
        Animated.timing(suggestionFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    };

    const interval = setInterval(cycleSuggestion, 3200);
    return () => clearInterval(interval);
  }, [suggestionFade, shuffledPrompts.length]);

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

            {/* Suggestions */}
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Need a starting point?</Text>
              <Pressable
                onPress={() => {
                  lightHaptic();
                  setQuery(shuffledPrompts[suggestionIndex]);
                }}
              >
                <Animated.View style={[styles.suggestionHighlight, { opacity: suggestionFade }]}>
                  <Ionicons name="sparkles" size={16} color="#10b981" />
                  <Text style={styles.suggestionHighlightText}>
                    {shuffledPrompts[suggestionIndex]}
                  </Text>
                </Animated.View>
              </Pressable>

              <View style={styles.suggestionChipsRow}>
                {suggestionChips.map((chip) => (
                  <Pressable
                    key={chip.text}
                    style={({ pressed }) => [
                      styles.suggestionChip,
                      pressed && styles.suggestionChipPressed,
                    ]}
                    onPress={() => {
                      lightHaptic();
                      setQuery(chip.text);
                    }}
                  >
                    <Ionicons name={chip.icon} size={14} color="#10b981" />
                    <Text style={styles.suggestionChipText}>{chip.text}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Banner Ad */}
        <BannerAdComponent style={styles.bannerAd} />
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
    lineHeight: 20,
    maxWidth: 300,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  glassCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 32,
    padding: 16,
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.6)",
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
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
      } as any,
    }),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    width: "100%",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.4)",
      },
      android: {
        backgroundColor: "#f8fafc",
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.4)",
      },
    }),
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
  suggestionsContainer: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    marginTop: 16,
    gap: 10,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  suggestionHighlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.18)",
  },
  suggestionHighlightPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  suggestionHighlightText: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "500",
  },
  suggestionChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.1)",
      },
    }),
  },
  suggestionChipPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: "rgba(16, 185, 129, 0.05)",
  },
  suggestionChipText: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "500",
  },
});
