import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
  Share,
  Modal,
  Alert,
  Animated,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { ShareableVerseCard } from "../src/components/ShareableVerseCard";
import { getGuidance, getExplanation, type VerseData, type ExplanationData } from "../src/services/guidance";
import { isBookmarked as checkIsBookmarked, addBookmark, removeBookmarkByReference } from "../src/services/bookmarks";
import { updateStreak } from "../src/services/streak";
import { useDataCache } from "../src/lib/DataCache";
import { useAuth } from "../src/lib/AuthContext";
import { 
  getTodaysGuidance, 
  type DailyGuidance,
  getGuidanceHistory,
  getDaysOfGuidance,
} from "../src/services/dailyGuidance";
import { NativeAdLoading } from "../src/components/NativeAdLoading";
import { BannerAdComponent } from "../src/components/BannerAdComponent";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { successHaptic, mediumHaptic, lightHaptic } from "../src/lib/haptics";
import { playGuidanceLoadedSound } from "../src/lib/sounds";
import { EtherealBackground } from "../src/components/EtherealBackground";
import { useOnboarding, goalDisplayNames, styleDisplayNames } from "../src/lib/OnboardingContext";
import { findTodaysChatByVerse } from "../src/services/chats";
import { usePremium } from "../src/lib/PremiumContext";
import { PremiumPopup } from "../src/components/PremiumPopup";
import { capitalizeFirstLetter } from "../src/lib/textUtils";
import {
  canRefreshVerse,
  recordVerseRefresh,
  getVerseRefreshUsage,
  FREE_VERSE_REFRESH_LIMIT,
} from "../src/lib/premiumLimits";

// Conditionally import ViewShot - it may not be available in dev builds
let ViewShot: any = null;
try {
  ViewShot = require("react-native-view-shot").default;
} catch (e) {
}

const appLogo = require("../assets/mascot/bird-reading.png");

// â”€â”€ Compact golden "Your Daily Guidance" header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DailyGuidanceHeader({ theme }: { theme?: string }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 3000, useNativeDriver: false })
    ).start();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.4, 0.5, 0.6, 1],
    outputRange: [0.7, 0.7, 1, 0.7, 0.7],
  });

  return (
    <View style={dailyHeaderStyles.wrapper}>
      <Animated.View style={[dailyHeaderStyles.row, { opacity: shimmerOpacity }]}>
        <LinearGradient
          colors={["transparent", "#10b981", "#6ee7b7", "#10b981", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={dailyHeaderStyles.rule}
        />
        <Text style={dailyHeaderStyles.title}>Your Daily Guidance</Text>
        <LinearGradient
          colors={["transparent", "#10b981", "#6ee7b7", "#10b981", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={dailyHeaderStyles.rule}
        />
      </Animated.View>
      {theme ? <Text style={dailyHeaderStyles.theme}>{theme.toUpperCase()}</Text> : null}
    </View>
  );
}

const dailyHeaderStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rule: {
    flex: 1,
    height: 1,
    maxWidth: 40,
    opacity: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.3,
    textShadowColor: "rgba(16, 185, 129, 0.25)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  theme: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#10b981",
    marginTop: 4,
    opacity: 0.7,
  },
});

// â”€â”€ Floating Chat FAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FloatingChatFAB({ onPress }: { onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance: spring in
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();

    // Subtle pulse glow loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim, pulseAnim]);

  return (
    <Animated.View
      style={[
        fabStyles.wrapper,
        {
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          fabStyles.button,
          pressed && fabStyles.buttonPressed,
        ]}
      >
        <LinearGradient
          colors={["#34d399", "#10b981", "#059669"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={fabStyles.gradient}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color="#ffffff" />
        </LinearGradient>
      </Pressable>
      <View style={fabStyles.label}>
        <Text style={fabStyles.labelText}>Chat</Text>
      </View>
    </Animated.View>
  );
}

const fabStyles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    right: 20,
    bottom: Platform.select({ ios: 160, default: 150, web: 150 }),
    alignItems: "center",
    zIndex: 50,
  },
  button: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#059669",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      default: {
        elevation: 10,
      },
      web: {
        boxShadow: "0 6px 20px rgba(5, 150, 105, 0.35), 0 2px 6px rgba(5, 150, 105, 0.2)",
      },
    }),
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.92 }],
  },
  gradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 4,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      default: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 1px 4px rgba(15, 23, 42, 0.08)",
      },
    }),
  },
  labelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065f46",
    letterSpacing: 0.3,
  },
});

export default function GuidanceScreen() {
  const params = useLocalSearchParams<{
    q: string;
    daily?: string;
    verseText?: string;
    verseReference?: string;
    verseTheme?: string;
    explanationData?: string;
    existingChatId?: string; // Chat ID from history to prevent duplicates
  }>();
  const { q: query } = params;
  const isDailyRequest = params.daily === "true" || params.daily === "1";
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  
  // Get onboarding preferences
  const { data: onboardingData } = useOnboarding();
  
  // Get cache invalidation function
  const { invalidateBookmarks } = useDataCache();
  const { isAuthenticated } = useAuth();
  const { isPremium } = usePremium();
  const [premiumPopupVisible, setPremiumPopupVisible] = useState(false);
  const [verseRefreshCount, setVerseRefreshCount] = useState(0);

  // Build enhanced query with user preferences
  const buildEnhancedQuery = useCallback((baseQuery: string): string => {
    // If user has set goals, incorporate them into the query
    const goals = onboardingData.goalCategories;
    const style = onboardingData.preferredStyle;
    
    // If no goals set, just return the base query
    if (!goals || goals.length === 0) {
      return baseQuery;
    }

    // Build goal context
    const goalDescriptions = goals.map(g => goalDisplayNames[g]).join(" and ");
    
    // Build style context
    let styleContext = "";
    if (style === "gentle") {
      styleContext = "Please provide warm, supportive, and encouraging guidance.";
    } else if (style === "direct") {
      styleContext = "Please be clear, focused, and actionable.";
    } else if (style === "deep") {
      styleContext = "Please provide rich biblical context and scripture study.";
    }

    // For "daily guidance" queries, personalize based on goals
    if (baseQuery.toLowerCase().includes("daily guidance") || baseQuery.toLowerCase().includes("today")) {
      return `I'm seeking guidance today. My spiritual focus is on: ${goalDescriptions}. ${styleContext} ${baseQuery}`;
    }
    
    // For other queries, add context about their goals
    return `${baseQuery}. (Context: I'm working on ${goalDescriptions}. ${styleContext})`;
  }, [onboardingData.goalCategories, onboardingData.preferredStyle]);

  // Check if we have restored data from a saved chat
  const restoredVerseData: VerseData | null = params.verseText && params.verseReference
    ? {
        reference: {
          book: "",
          chapter: 0,
          verse: 0,
          passage: params.verseReference,
        },
        text: params.verseText,
        translation: "NIV",
        theme: params.verseTheme || "",
      }
    : null;

  const restoredExplanationData: ExplanationData | null = params.explanationData
    ? JSON.parse(params.explanationData)
    : null;

  const [verseData, setVerseData] = useState<VerseData | null>(restoredVerseData);
  const [explanationData, setExplanationData] = useState<ExplanationData | null>(restoredExplanationData);
  const [isLoadingVerse, setIsLoadingVerse] = useState(!restoredVerseData);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const viewShotRef = useRef<any>(null);

  const normalizeSecondPerson = (text: string) => {
    return text
      .replace(/\bmy\b/gi, "your")
      .replace(/\bmyself\b/gi, "yourself")
      .replace(/\bme\b/gi, "you")
      .replace(/\bI\b/g, "You")
      .replace(/\bI'm\b/gi, "You're")
      .replace(/\bI've\b/gi, "You've")
      .replace(/\bI\'m\b/gi, "You're")
      .replace(/\bI\'ve\b/gi, "You've")
      .replace(/\bI\'ll\b/gi, "You'll")
      .replace(/\bI\â€™m\b/gi, "You're")
      .replace(/\bI\â€™ve\b/gi, "You've")
      .replace(/\bI\â€™ll\b/gi, "You'll");
  };

  // Check if verse is already bookmarked
  useEffect(() => {
    if (verseData?.reference.passage) {
      const checkBookmark = async () => {
        try {
          const result = await checkIsBookmarked(verseData.reference.passage);
          setBookmarked(result);
        } catch (error) {
        }
      };
      checkBookmark();
    }
  }, [verseData?.reference.passage]);

  const handleToggleBookmark = async () => {
    if (isBookmarking || !verseData) return;
    if (!isAuthenticated) {
      Alert.alert(
        "Sign in required",
        "You need to sign in to save bookmarks.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Sign in", onPress: () => router.push("/(auth)") },
        ]
      );
      return;
    }

    const wasBookmarked = bookmarked;
    // Optimistic update
    setBookmarked(!wasBookmarked);
    successHaptic();
    setIsBookmarking(true);
    try {
      if (wasBookmarked) {
        await removeBookmarkByReference(verseData.reference.passage);
      } else {
        await addBookmark(verseData.text, verseData.reference.passage);
      }
      invalidateBookmarks();
    } catch (error) {
      // Revert on failure
      setBookmarked(wasBookmarked);
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleShare = async () => {
    if (!verseData) return;
    
    mediumHaptic();
    try {
      await Share.share({
        message: `"${verseData.text}"\n\n- ${verseData.reference.passage}\n\nFor more guidance, visit givemeguidance.com`,
        title: "Share Verse",
      });
    } catch (error) {
    }
  };

  const handleSaveImagePress = () => {
    if (!verseData) return;
    lightHaptic();
    setShowSharePreview(true);
  };

  const handleCaptureAndShare = async () => {
    if (!ViewShot || !viewShotRef.current?.capture) {
      setShowSharePreview(false);
      return;
    }
    
    setIsCapturingImage(true);
    try {
      const uri = await viewShotRef.current.capture();
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/jpeg",
          dialogTitle: "Share this verse",
        });
        successHaptic();
      }
    } catch (error) {
    } finally {
      setIsCapturingImage(false);
      setShowSharePreview(false);
    }
  };

  const fetchExplanation = useCallback(
    async (
      userQuestion: string,
      verse: VerseData
    ) => {
      setIsLoadingExplanation(true);

      try {
        const data = await getExplanation(
          userQuestion,
          verse.text,
          verse.reference.passage,
          verse.translation
        );
        setExplanationData(data);
        
        // Save to daily guidance cache for history (with theme from verse)
        saveToDailyCache(userQuestion, verse, data);
      } catch (err) {
      } finally {
        setIsLoadingExplanation(false);
      }
    },
    []
  );

  // Save guidance to daily cache for history tracking
  const saveToDailyCache = async (
    userQuery: string,
    verse: VerseData,
    explanation: ExplanationData | null
  ) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const DAILY_GUIDANCE_KEY = "daily_guidance";
      const GUIDANCE_HISTORY_KEY = "guidance_history";
      const DAYS_OF_GUIDANCE_KEY = "days_of_guidance";

      // ALWAYS update streak when guidance is received (the streak service handles deduplication)
      try {
        await updateStreak();
      } catch (activityError) {
        // Don't fail the whole save if streak update fails
      }

      // Check existing daily entry to keep one stable guidance per day.
      // Allow only same-verse updates (for example adding explanation later).
      const existingData = await AsyncStorage.getItem(DAILY_GUIDANCE_KEY);
      let existingDaily: DailyGuidance | null = null;
      if (existingData) {
        try {
          existingDaily = JSON.parse(existingData);
        } catch {
          existingDaily = null;
        }
      }

      if (existingDaily?.date === today) {
        const existingPassage = existingDaily.verse?.reference?.passage;
        const incomingPassage = verse.reference.passage;
        const isSamePassage = existingPassage === incomingPassage;

        // Preserve the first guidance chosen for today.
        if (!isSamePassage) {
          return;
        }

        // Do not replace richer existing data with less complete data.
        if (existingDaily.explanation && !explanation) {
          return;
        }
      }

      // Save daily guidance
      const dailyGuidance: DailyGuidance = {
        date: today,
        query: userQuery,
        verse: verse,
        explanation: explanation,
        receivedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(DAILY_GUIDANCE_KEY, JSON.stringify(dailyGuidance));

      // Add to history
      const historyStr = await AsyncStorage.getItem(GUIDANCE_HISTORY_KEY);
      const history = historyStr ? JSON.parse(historyStr) : [];
      const historyEntry = {
        date: today,
        theme: verse.theme || "Guidance",
        passage: verse.reference.passage,
        verseSnippet: verse.text.substring(0, 60) + (verse.text.length > 60 ? "..." : ""),
      };
      
      // Check if today already exists in history
      const existingIndex = history.findIndex((h: any) => h.date === today);
      if (existingIndex >= 0) {
        history[existingIndex] = historyEntry;
      } else {
        history.unshift(historyEntry);
      }
      await AsyncStorage.setItem(GUIDANCE_HISTORY_KEY, JSON.stringify(history.slice(0, 90)));

      // Increment days counter
      const daysStr = await AsyncStorage.getItem(DAYS_OF_GUIDANCE_KEY);
      const days = daysStr ? parseInt(daysStr, 10) : 0;
      if (existingIndex < 0) {
        await AsyncStorage.setItem(DAYS_OF_GUIDANCE_KEY, String(days + 1));
      }
    } catch (error) {
    }
  };

  const fetchGuidance = useCallback(
    async (searchQuery: string) => {
      setIsLoadingVerse(true);
      setError(null);
      setExplanationData(null);
      setBookmarked(false);

      try {
        // Enhance the query with user's onboarding preferences
        const enhancedQuery = buildEnhancedQuery(searchQuery);

        // Gather recently shown verse references to avoid repetition
        const history = await getGuidanceHistory();
        const recentVerses = history.slice(0, 30).map((entry) => entry.passage);

        const data = await getGuidance(enhancedQuery, recentVerses);
        setVerseData(data);

        // Persist daily guidance immediately so revisits return the same entry
        // even if the user leaves before explanation finishes loading.
        if (isDailyRequest) {
          await saveToDailyCache(searchQuery, data, null);
        }
        
        // Play sound when guidance loads
        playGuidanceLoadedSound();

        fetchExplanation(searchQuery, data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoadingVerse(false);
      }
    },
    [fetchExplanation, buildEnhancedQuery, isDailyRequest]
  );

  useEffect(() => {
    let cancelled = false;

    const loadGuidance = async () => {
      if (!query) {
        router.back();
        return;
      }

      // Skip fetching if we have restored data from a saved chat
      if (restoredVerseData) {
        return;
      }

      if (isDailyRequest) {
        setIsLoadingVerse(true);
        setError(null);
        try {
          const cachedDaily = await getTodaysGuidance();
          if (cancelled) return;

          if (cachedDaily) {
            setVerseData(cachedDaily.verse);
            setExplanationData(cachedDaily.explanation);
            setIsLoadingVerse(false);
            setBookmarked(false);

            // Recover explanation if older cached entry exists without it.
            if (!cachedDaily.explanation) {
              fetchExplanation(cachedDaily.query || query, cachedDaily.verse);
            }
            return;
          }
        } catch (cacheError) {
        }
      }

      fetchGuidance(query);
    };

    loadGuidance();

    return () => {
      cancelled = true;
    };
  }, [query, router, fetchGuidance, restoredVerseData, isDailyRequest, fetchExplanation]);

  // Load verse-refresh count on mount
  useEffect(() => {
    getVerseRefreshUsage().then(({ used }) => setVerseRefreshCount(used));
  }, []);

  const handleGetAnotherVerse = async () => {
    if (!query) return;

    const allowed = await canRefreshVerse(isPremium);
    if (!allowed) {
      mediumHaptic();
      setPremiumPopupVisible(true);
      return;
    }

    const newCount = await recordVerseRefresh();
    setVerseRefreshCount(newCount);
    fetchGuidance(query);
  };

  const handleChatMore = async () => {
    if (!explanationData || !verseData) return;
    if (!isAuthenticated) {
      Alert.alert(
        "Sign in required",
        "You need to sign in to save and continue chats.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Sign in", onPress: () => router.push("/(auth)") },
        ]
      );
      return;
    }
    
    // If we have an existing chat ID from history, use it instead of creating a new chat
    if (params.existingChatId) {
      router.push({
        pathname: "/chat",
        params: { chatId: params.existingChatId },
      });
      return;
    }

    // Check if there's already a chat for this verse created today
    const existingChatId = await findTodaysChatByVerse(verseData.reference.passage);
    if (existingChatId) {
      router.push({
        pathname: "/chat",
        params: { chatId: existingChatId },
      });
      return;
    }
    
    router.push({
      pathname: "/chat",
      params: {
        verseReference: verseData.reference.passage,
        verseText: verseData.text,
        verseTheme: verseData.theme || "",
        userQuestion: query,
        explanation: JSON.stringify({
          verse_explanation: explanationData.verse_explanation,
          connection_to_user_need: explanationData.connection_to_user_need,
          guidance_application: explanationData.guidance_application,
          reflection_prompt: explanationData.reflection_prompt || "",
        }),
      },
    });
  };

  const handleReflectionPrompt = async (prompt: string) => {
    if (!verseData) return;
    if (!isAuthenticated) {
      Alert.alert(
        "Sign in required",
        "You need to sign in to save and continue chats.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Sign in", onPress: () => router.push("/(auth)") },
        ]
      );
      return;
    }

    const normalizedPrompt = normalizeSecondPerson(prompt);
    
    // If we have an existing chat ID from history, use it instead of creating a new chat
    if (params.existingChatId) {
      router.push({
        pathname: "/chat",
        params: { chatId: params.existingChatId },
      });
      return;
    }

    // Check if there's already a chat for this verse created today
    const existingChatId = await findTodaysChatByVerse(verseData.reference.passage);
    if (existingChatId) {
      router.push({
        pathname: "/chat",
        params: { chatId: existingChatId },
      });
      return;
    }
    
    router.push({
      pathname: "/chat",
      params: {
        verseReference: verseData.reference.passage,
        verseText: verseData.text,
        userQuestion: query, // Original user question for the chat title
        reflectionPrompt: normalizedPrompt, // The "Reflect Deeper" question
        explanation: explanationData ? JSON.stringify(explanationData) : undefined,
      },
    });
  };

  if (!query) {
    return null;
  }

  if (isLoadingVerse) {
    return (
      <View style={styles.centerContainer}>
        <NativeAdLoading 
          isVisible={true} 
          loadingMessage="Finding the perfect verse for you..." 
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorIcon}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        </View>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => fetchGuidance(query)}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (!verseData) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Ethereal background with floating leaves */}
      <EtherealBackground variant="guidance" intensity="low" />
      
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + 12 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Guidance Header OR User Query Display */}
        {isDailyRequest ? (
          <DailyGuidanceHeader theme={verseData.theme} />
        ) : (
          <>
            {query && (
              <View style={styles.userQueryContainer}>
                <Text style={styles.userQueryLabel}>You shared:</Text>
                <Text style={styles.userQueryText}>"{query}"</Text>
              </View>
            )}

            {/* Header Label with Theme */}
            <View style={styles.headerLabel}>
              {verseData.theme && (
                <View style={styles.themeBadge}>
                  <Text style={styles.themeBadgeText}>{verseData.theme.toUpperCase()}</Text>
                </View>
              )}
              <Text style={styles.headerLabelText}>TODAY'S GUIDANCE</Text>
              <Text style={styles.headerSubtitle}>For you</Text>
            </View>
          </>
        )}

        {/* Main Verse Card */}
        <View style={styles.verseCard}>
          {/* Decorative blur circle */}
          <View style={styles.decorativeCircle} />
          
          {/* Quote icon */}
          <Text style={styles.quoteIcon}>"</Text>
          
          {/* Verse text */}
          <Text style={styles.verseText}>{capitalizeFirstLetter(verseData.text)}</Text>
          
          {/* Reference divider */}
          <View style={styles.referenceDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.verseReference}>{verseData.reference.passage}</Text>
            <View style={styles.dividerLine} />
          </View>
          
          {/* Guidance message */}
          {isLoadingExplanation ? (
            <View style={styles.guidanceLoading}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.guidanceLoadingText}>Preparing your guidance...</Text>
            </View>
          ) : null}

          {/* Subtle mascot accent */}
          <Image
            source={appLogo}
            style={styles.verseCardLogo}
            resizeMode="contain"
          />
        </View>

        {/* Full Explanation Section */}
        {explanationData && (
          <View style={styles.explanationCard}>
            {/* Understanding This Verse */}
            <View style={styles.explanationSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="book-outline" size={18} color="#10b981" />
                <Text style={styles.sectionTitle}>Understanding This Verse</Text>
              </View>
              <Text style={styles.sectionBody}>{explanationData.verse_explanation}</Text>
            </View>

            <View style={styles.sectionDivider} />

            {/* How This Speaks to You */}
            <View style={styles.explanationSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="heart-outline" size={18} color="#10b981" />
                <Text style={styles.sectionTitle}>How This Speaks to You</Text>
              </View>
              <Text style={styles.sectionBody}>{explanationData.connection_to_user_need}</Text>
            </View>

            <View style={styles.sectionDivider} />

            {/* Living It Out */}
            <View style={styles.explanationSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="footsteps-outline" size={18} color="#10b981" />
                <Text style={styles.sectionTitle}>Living It Out</Text>
              </View>
              <Text style={styles.sectionBody}>{explanationData.guidance_application}</Text>
            </View>
          </View>
        )}

        {/* Reflect Deeper Section */}
        {explanationData && (
          <View style={styles.reflectSection}>
            <Text style={styles.reflectTitle}>REFLECT DEEPER</Text>
            
            {/* Dynamic AI-generated reflection prompt */}
            {explanationData.reflection_prompt && (
              <Pressable
                style={({ pressed }) => [
                  styles.reflectButton,
                  styles.reflectButtonHighlight,
                  pressed && styles.reflectButtonPressed,
                ]}
                onPress={() => handleReflectionPrompt(normalizeSecondPerson(explanationData.reflection_prompt))}
              >
                <Ionicons name="sparkles" size={18} color="#10b981" style={styles.reflectIcon} />
                <Text style={styles.reflectButtonTextHighlight}>
                  {normalizeSecondPerson(explanationData.reflection_prompt)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#10b981" />
              </Pressable>
            )}
            
            <Pressable
              style={({ pressed }) => [
                styles.reflectButton,
                pressed && styles.reflectButtonPressed,
              ]}
              onPress={() => handleReflectionPrompt("What is weighing heaviest on your heart right now?")}
            >
              <Text style={styles.reflectButtonText}>What is weighing heaviest on your heart?</Text>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </Pressable>
            
            <Pressable
              style={({ pressed }) => [
                styles.reflectButton,
                pressed && styles.reflectButtonPressed,
              ]}
              onPress={() => handleReflectionPrompt("Who can you share this peace with today?")}
            >
              <Text style={styles.reflectButtonText}>Who can you share this peace with today?</Text>
              <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
            </Pressable>
          </View>
        )}

        {/* Another verse button */}
        <Pressable
          style={({ pressed }) => [
            styles.anotherVerseButton,
            pressed && styles.anotherVerseButtonPressed,
          ]}
          onPress={handleGetAnotherVerse}
          disabled={isLoadingExplanation}
        >
          <Ionicons name="refresh" size={18} color="#10b981" />
          <Text style={styles.anotherVerseText}>Give me another verse</Text>
          {!isPremium && (
            <Text style={styles.anotherVerseCounter}>
              {Math.max(0, FREE_VERSE_REFRESH_LIMIT - verseRefreshCount)}/{FREE_VERSE_REFRESH_LIMIT}
            </Text>
          )}
        </Pressable>

        <PremiumPopup
          visible={premiumPopupVisible}
          onClose={() => setPremiumPopupVisible(false)}
        />

        {/* Banner Ad */}
        <BannerAdComponent style={styles.bannerAd} />
      </ScrollView>

      {/* Floating Chat FAB */}
      {explanationData && verseData && (
        <FloatingChatFAB onPress={handleChatMore} />
      )}

      {/* Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.footerActions}>
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              bookmarked && styles.saveButtonSaved,
              pressed && styles.saveButtonPressed,
            ]}
            onPress={handleToggleBookmark}
            disabled={isBookmarking}
          >
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={22}
              color="#ffffff"
            />
            <Text style={styles.saveButtonText}>
              {bookmarked ? "Saved" : "Save for Later"}
            </Text>
          </Pressable>
          
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
            onPress={handleSaveImagePress}
          >
            <Ionicons name="image-outline" size={22} color="#64748b" />
          </Pressable>
          
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={22} color="#64748b" />
          </Pressable>
        </View>
        
        {/* Home indicator */}
        <View style={styles.homeIndicator} />
      </View>

      {/* Share Image Preview Modal */}
      <Modal
        visible={showSharePreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSharePreview(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSharePreview(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Verse</Text>
            <Text style={styles.modalSubtitle}>Preview your shareable image</Text>
            
            {ViewShot ? (
              <ViewShot
                ref={viewShotRef}
                options={{ format: "jpg", quality: 0.95 }}
                style={styles.viewShotContainer}
              >
                <ShareableVerseCard
                  verseText={verseData?.text || ""}
                  verseReference={verseData?.reference.passage || ""}
                />
              </ViewShot>
            ) : (
              <View style={styles.viewShotContainer}>
                <ShareableVerseCard
                  verseText={verseData?.text || ""}
                  verseReference={verseData?.reference.passage || ""}
                />
              </View>
            )}
            
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalButton, styles.cancelButton, pressed && { opacity: 0.7 }]}
                onPress={() => setShowSharePreview(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [styles.modalButton, styles.shareImageButton, pressed && { opacity: 0.7 }]}
                onPress={handleCaptureAndShare}
                disabled={isCapturingImage}
              >
                {isCapturingImage ? (
                  <Text style={styles.shareImageButtonText}>Sharing...</Text>
                ) : (
                  <>
                    <Ionicons name="share-outline" size={18} color="#ffffff" />
                    <Text style={styles.shareImageButtonText}>Share Image</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafaf6",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 140,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fafaf6",
    gap: 12,
  },
  loadingAnimation: {
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#6b7280",
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ef4444",
  },
  errorMessage: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      default: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
      },
    }),
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerLabel: {
    alignItems: "center",
    marginBottom: 24,
  },
  themeBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  themeBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#059669",
  },
  headerLabelText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#10b981",
    opacity: 0.8,
    textTransform: "uppercase",
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 2,
  },
  userQueryContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  userQueryLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  userQueryText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 26,
  },
  verseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 32,
    padding: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#064e3b",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      default: {
        elevation: 8,
      },
      web: {
        boxShadow: "0 8px 32px rgba(6, 78, 59, 0.08)",
      },
    }),
  },
  decorativeCircle: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(16, 185, 129, 0.05)",
  },
  verseCardLogo: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 52,
    height: 52,
    opacity: 0.4,
  },
  quoteIcon: {
    fontSize: 64,
    color: "rgba(16, 185, 129, 0.2)",
    fontFamily: Platform.select({ ios: "Georgia", default: "serif", web: "Georgia, serif" }),
    lineHeight: 64,
    marginBottom: 8,
    marginTop: -16,
    marginLeft: -8,
  },
  verseText: {
    fontSize: 20,
    lineHeight: 32,
    color: "#1f2937",
    fontStyle: "italic",
    fontFamily: Platform.select({ ios: "Georgia", default: "serif", web: "Georgia, serif" }),
  },
  referenceDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  verseReference: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  guidanceLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    gap: 10,
    paddingVertical: 8,
  },
  guidanceLoadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
  explanationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    ...Platform.select({
      ios: {
        shadowColor: "#064e3b",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      default: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 4px 16px rgba(6, 78, 59, 0.05)",
      },
    }),
  },
  explanationSection: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 24,
    color: "#4b5563",
    paddingLeft: 26,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 20,
  },
  reflectSection: {
    marginBottom: 16,
    gap: 12,
  },
  reflectTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#9ca3af",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  reflectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 16,
    padding: 16,
  },
  reflectButtonPressed: {
    backgroundColor: "#ffffff",
  },
  reflectButtonHighlight: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  reflectIcon: {
    marginRight: 10,
  },
  reflectButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  reflectButtonTextHighlight: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#065f46",
    fontStyle: "italic",
  },
  anotherVerseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    marginTop: 8,
  },
  anotherVerseButtonPressed: {
    backgroundColor: "#f9fafb",
  },
  anotherVerseText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#10b981",
  },
  anotherVerseCounter: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    marginLeft: 4,
  },
  bannerAd: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 16,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.select({ ios: 34, default: 24, web: 24 }),
  },
  footerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      default: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
      },
    }),
  },
  saveButtonSaved: {
    backgroundColor: "#059669",
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPressed: {
    backgroundColor: "#e2e8f0",
  },
  homeIndicator: {
    alignSelf: "center",
    width: 128,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    marginTop: 16,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      default: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
  },
  viewShotContainer: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#f0fdf4",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  shareImageButton: {
    backgroundColor: "#10b981",
  },
  shareImageButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
});



