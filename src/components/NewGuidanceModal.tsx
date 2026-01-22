import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { EtherealBackground } from "./EtherealBackground";
import { BannerAdComponent } from "./BannerAdComponent";
import { usePremium } from "../lib/PremiumContext";
import { useAds } from "../lib/AdsContext";
import { mediumHaptic, lightHaptic } from "../lib/haptics";

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

// Inspiring words that cycle
const inspiringWords = [
  "Clarity",
  "Peace",
  "Wisdom",
  "Hope",
  "Strength",
  "Grace",
  "Purpose",
  "Healing",
  "Joy",
  "Faith",
];

interface NewGuidanceModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NewGuidanceModal({ visible, onClose }: NewGuidanceModalProps) {
  const router = useRouter();
  const { isPremium } = usePremium();
  const { maybeShowInterstitialAd } = useAds();
  const [query, setQuery] = useState("");
  const [inspiringWord, setInspiringWord] = useState("Clarity");

  // Pick a random inspiring word when modal opens
  useEffect(() => {
    if (visible) {
      setQuery("");
      const randomWord = inspiringWords[Math.floor(Math.random() * inspiringWords.length)];
      setInspiringWord(randomWord);
    }
  }, [visible]);

  const handleTopicPress = (topicId: string) => {
    lightHaptic();
    const prompt = topicPrompts[topicId];
    setQuery(prompt);
  };

  const handleSearch = async () => {
    if (query.trim()) {
      mediumHaptic();
      
      // Show interstitial ad 1 in 4 times for non-premium users
      if (!isPremium) {
        await maybeShowInterstitialAd(0.25);
      }
      
      onClose();
      router.push({
        pathname: "/guidance",
        params: { q: query.trim() },
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.wrapper}>
        {/* Ethereal background */}
        <EtherealBackground />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* Header with close button */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>New Guidance</Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Heading */}
            <View style={styles.headingContainer}>
              <Text style={styles.heading}>
                Explore Paths to{"\n"}
                <Text style={styles.headingGradient}>{inspiringWord}</Text>
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

            {/* Banner Ad */}
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 16 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.5)",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241, 245, 249, 0.8)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  headingContainer: {
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#0f172a",
    lineHeight: 32,
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
    maxWidth: 320,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  topicGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    maxWidth: 380,
    gap: 10,
    marginBottom: 20,
  },
  topicCard: {
    width: "48%",
    flexGrow: 1,
    flexBasis: "45%",
    borderRadius: 16,
    padding: 14,
    alignItems: "flex-start",
    gap: 8,
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 3,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
      } as any,
    }),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  topicCardPressed: {
    transform: [{ scale: 0.97 }],
    backgroundColor: "rgba(255, 255, 255, 1)",
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
    padding: 18,
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 5,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 28px rgba(16, 185, 129, 0.1)",
      } as any,
    }),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  cantFindLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(248, 250, 252, 0.9)",
      },
      android: {
        backgroundColor: "#f8fafc",
      },
      web: {
        backgroundColor: "rgba(248, 250, 252, 0.9)",
      },
    }),
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "400",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: "0 6px 24px rgba(16, 185, 129, 0.3)",
      } as any,
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  bannerAd: {
    width: "100%",
    maxWidth: 380,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
});
