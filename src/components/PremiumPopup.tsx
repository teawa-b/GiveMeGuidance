import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePremium, PremiumPackage } from "../lib/PremiumContext";
import { lightHaptic, mediumHaptic, successHaptic } from "../lib/haptics";
import {
  FREE_VERSE_REFRESH_LIMIT,
  FREE_CHAT_MESSAGE_LIMIT,
  FREE_HISTORY_DAYS,
} from "../lib/premiumLimits";

const appLogo = require("../../assets/mascot/bird-reading.png");
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FEATURES = [
  {
    icon: "book-outline" as const,
    label: "Unlimited Verses",
    detail: `Free: ${FREE_VERSE_REFRESH_LIMIT}/day`,
  },
  {
    icon: "chatbubble-outline" as const,
    label: "Unlimited Chat",
    detail: `Free: ${FREE_CHAT_MESSAGE_LIMIT}/day`,
  },
  {
    icon: "time-outline" as const,
    label: "Full History",
    detail: `Free: ${FREE_HISTORY_DAYS} days`,
  },
  {
    icon: "eye-off-outline" as const,
    label: "Ad-Free",
    detail: "No interruptions",
  },
  {
    icon: "heart-outline" as const,
    label: "Support Us",
    detail: "Fund our mission",
  },
] as const;

interface PremiumPopupProps {
  visible: boolean;
  onClose: () => void;
  useRevenueCatPaywall?: boolean;
}

export function PremiumPopup({
  visible,
  onClose,
  useRevenueCatPaywall = false,
}: PremiumPopupProps) {
  const {
    packages,
    purchasePackage,
    restorePurchases,
    isPremium,
    presentPaywall,
    isLoading,
  } = usePremium();

  const [selectedPackage, setSelectedPackage] = useState<PremiumPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const slideAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const shouldUseNativePaywall = useRevenueCatPaywall && Platform.OS !== "web";

  // RevenueCat native paywall fallback
  useEffect(() => {
    if (visible && shouldUseNativePaywall) {
      const showPaywall = async () => {
        const purchased = await presentPaywall();
        if (purchased) successHaptic();
        onClose();
      };
      showPaywall();
    }
  }, [visible, shouldUseNativePaywall, presentPaywall, onClose]);

  // Animate in/out
  useEffect(() => {
    if (shouldUseNativePaywall) return;

    if (visible) {
      const yearly = packages.find((p) => p.period === "yearly");
      const lifetime = packages.find((p) => p.period === "lifetime");
      setSelectedPackage(yearly || lifetime || packages[0] || null);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, packages, shouldUseNativePaywall]);

  if (isPremium) return null;
  if (shouldUseNativePaywall && visible) return null;

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handlePurchase = async () => {
    if (!selectedPackage || isPurchasing) return;
    mediumHaptic();
    setIsPurchasing(true);
    try {
      const success = await purchasePackage(selectedPackage);
      if (success) {
        successHaptic();
        onClose();
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    lightHaptic();
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        successHaptic();
        onClose();
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClose = () => {
    lightHaptic();
    onClose();
  };

  // â”€â”€ Package helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const monthlyPackage = packages.find((p) => p.period === "monthly");
  const yearlyPackage = packages.find((p) => p.period === "yearly");
  const lifetimePackage = packages.find((p) => p.period === "lifetime");

  const isSelected = (pkg: PremiumPackage | undefined) =>
    pkg && selectedPackage?.identifier === pkg.identifier;

  const periodLabel = (pkg: PremiumPackage) => {
    switch (pkg.period) {
      case "yearly":
        return "/ year";
      case "monthly":
        return "/ month";
      case "lifetime":
        return "once";
      default:
        return "";
    }
  };

  const periodSubtitle = (pkg: PremiumPackage) => {
    switch (pkg.period) {
      case "yearly":
        return "Save 33% per year";
      case "monthly":
        return "Full flexibility";
      case "lifetime":
        return "One-time purchase";
      default:
        return "";
    }
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <Animated.View
        style={[
          styles.screen,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 400],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={["#f0fdf4", "#f8fafc"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative leaf shapes */}
        <View style={[styles.leafShape, styles.leaf1]} />
        <View style={[styles.leafShape, styles.leaf2]} />
        <View style={[styles.leafShape, styles.leaf3]} />

        {/* Close button */}
        <View style={styles.headerBar}>
          <Pressable
            style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.6 }]}
            onPress={handleClose}
            hitSlop={12}
          >
            <Ionicons name="close" size={22} color="#64748b" />
          </Pressable>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={Platform.OS === "android"}
          persistentScrollbar={Platform.OS === "android"}
          scrollIndicatorInsets={{ right: 2 }}
          fadingEdgeLength={Platform.OS === "android" ? 36 : 0}
          bounces={false}
        >
          {/* Mascot */}
          <View style={styles.mascotContainer}>
            <View style={styles.mascotGlow} />
            <Image source={appLogo} style={styles.mascotImage} resizeMode="contain" />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Support Your{"\n"}Spiritual Growth
          </Text>
          <Text style={styles.subtitle}>
            Deepen your journey with full access.
          </Text>

          {Platform.OS === "android" && (
            <View style={styles.scrollHintCard}>
              <Ionicons name="chevron-up-circle" size={16} color="#0f766e" />
              <Text style={styles.scrollHintText}>Swipe up for more plans</Text>
            </View>
          )}

          {/* Feature cards */}
          <View style={styles.featureRow}>
            {FEATURES.map((feat) => (
              <View key={feat.label} style={styles.featureCard}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={feat.icon} size={17} color="#10b981" />
                </View>
                <Text style={styles.featureCardLabel}>{feat.label}</Text>
              </View>
            ))}
          </View>

          {/* Pricing cards */}
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>Loading optionsâ€¦</Text>
            </View>
          ) : packages.length === 0 ? (
            <View style={styles.loadingWrap}>
              <Ionicons name="alert-circle-outline" size={44} color="#9ca3af" />
              <Text style={styles.loadingText}>
                {Platform.OS === "web"
                  ? "In-app purchases are only available on iOS and Mobile."
                  : "Unable to load subscription options."}
              </Text>
            </View>
          ) : (
            <View style={styles.cardsContainer}>
              {/* Yearly â€“ Best Value */}
              {yearlyPackage && (
                <Pressable
                  style={({ pressed }) => [
                    styles.pricingCard,
                    isSelected(yearlyPackage) && styles.pricingCardSelected,
                    pressed && styles.pricingCardPressed,
                  ]}
                  onPress={() => {
                    lightHaptic();
                    setSelectedPackage(yearlyPackage);
                  }}
                >
                  {isSelected(yearlyPackage) && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>BEST VALUE</Text>
                    </View>
                  )}
                  <View style={styles.cardRow}>
                    <View>
                      <Text style={styles.cardTitle}>Yearly</Text>
                      <Text style={styles.cardSubtitle}>{periodSubtitle(yearlyPackage)}</Text>
                    </View>
                    <View style={styles.cardPriceWrap}>
                      <Text style={styles.cardPrice}>{yearlyPackage.priceString}</Text>
                      <Text style={styles.cardPeriod}>{periodLabel(yearlyPackage)}</Text>
                    </View>
                  </View>
                </Pressable>
              )}

              {/* Lifetime */}
              {lifetimePackage && (
                <Pressable
                  style={({ pressed }) => [
                    styles.pricingCard,
                    isSelected(lifetimePackage) && styles.pricingCardSelected,
                    pressed && styles.pricingCardPressed,
                  ]}
                  onPress={() => {
                    lightHaptic();
                    setSelectedPackage(lifetimePackage);
                  }}
                >
                  <View style={styles.cardRow}>
                    <View>
                      <Text style={styles.cardTitle}>Lifetime</Text>
                      <Text style={styles.cardSubtitle}>{periodSubtitle(lifetimePackage)}</Text>
                    </View>
                    <View style={styles.cardPriceWrap}>
                      <Text style={styles.cardPrice}>{lifetimePackage.priceString}</Text>
                      <Text style={styles.cardPeriod}>{periodLabel(lifetimePackage)}</Text>
                    </View>
                  </View>
                </Pressable>
              )}

              {/* Monthly */}
              {monthlyPackage && (
                <Pressable
                  style={({ pressed }) => [
                    styles.pricingCard,
                    isSelected(monthlyPackage) && styles.pricingCardSelected,
                    pressed && styles.pricingCardPressed,
                  ]}
                  onPress={() => {
                    lightHaptic();
                    setSelectedPackage(monthlyPackage);
                  }}
                >
                  <View style={styles.cardRow}>
                    <View>
                      <Text style={styles.cardTitle}>Monthly</Text>
                      <Text style={styles.cardSubtitle}>{periodSubtitle(monthlyPackage)}</Text>
                    </View>
                    <View style={styles.cardPriceWrap}>
                      <Text style={styles.cardPrice}>{monthlyPackage.priceString}</Text>
                      <Text style={styles.cardPeriod}>{periodLabel(monthlyPackage)}</Text>
                    </View>
                  </View>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>

        {Platform.OS === "android" && (
          <View pointerEvents="none" style={styles.scrollFadeOverlay}>
            <LinearGradient
              colors={["transparent", "rgba(248, 250, 252, 0.96)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.scrollFadeGradient}
            />
            <View style={styles.scrollFadeArrowWrap}>
              <Ionicons name="chevron-up" size={16} color="#64748b" />
            </View>
          </View>
        )}

        {/* Sticky bottom CTA */}
        <View style={styles.bottomBar}>
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.continueButtonPressed,
              (isPurchasing || !selectedPackage) && styles.continueButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={isPurchasing || !selectedPackage}
          >
            <LinearGradient
              colors={["#5B8C5A", "#4A7A49"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueGradient}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.continueText}>Continue</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Pressable
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="#94a3b8" />
            ) : (
              <Text style={styles.restoreText}>RESTORE PURCHASES</Text>
            )}
          </Pressable>

          {/* Terms */}
          <Text style={styles.terms}>
            {Platform.OS !== "web"
              ? "Subscription automatically renews. Cancel anytime in App Store settings."
              : "Subscriptions are managed through the App Store on your device."}
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Decorative leaf shapes
  leafShape: {
    position: "absolute",
    backgroundColor: "#10b981",
    opacity: 0.05,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 0,
    zIndex: 0,
  },
  leaf1: {
    width: 180,
    height: 180,
    top: -20,
    left: -40,
    transform: [{ rotate: "-15deg" }],
  },
  leaf2: {
    width: 220,
    height: 220,
    top: "20%",
    right: -80,
    opacity: 0.06,
    transform: [{ rotate: "45deg" }],
  },
  leaf3: {
    width: 140,
    height: 140,
    bottom: "15%",
    left: -20,
    transform: [{ rotate: "-45deg" }],
  },

  // Header bar with close
  headerBar: {
    paddingTop: Platform.OS === "ios" ? 56 : (StatusBar.currentHeight ?? 32) + 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "flex-end",
    zIndex: 10,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(100, 116, 139, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Scrollable area
  scrollView: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    alignItems: "center",
  },

  // Mascot
  mascotContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  mascotGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
  },
  mascotImage: {
    width: 80,
    height: 80,
  },

  // Typography
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    lineHeight: 32,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    textAlign: "center",
    marginBottom: 10,
  },
  scrollHintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    marginBottom: 16,
  },
  scrollHintText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f766e",
  },
  scrollFadeOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Platform.OS === "android" ? 118 : 0,
    height: 50,
    zIndex: 15,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  scrollFadeGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollFadeArrowWrap: {
    marginBottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Feature cards row
  featureRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  featureCard: {
    alignItems: "center",
    gap: 6,
    width: 60,
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureCardLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
    lineHeight: 13,
  },

  // Loading
  loadingWrap: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },

  // Pricing cards
  cardsContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 8,
  },
  pricingCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    position: "relative",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      default: {
        backgroundColor: "#ffffff",
        elevation: 2,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
      },
    }),
  },
  pricingCardSelected: {
    borderColor: "#10b981",
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      default: { elevation: 4 },
    }),
  },
  pricingCardPressed: {
    opacity: 0.85,
  },
  bestValueBadge: {
    position: "absolute",
    top: -10,
    right: 24,
    backgroundColor: "#10b981",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      default: { elevation: 3 },
    }),
  },
  bestValueText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  cardPriceWrap: {
    alignItems: "flex-end",
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  cardPeriod: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "500",
    textTransform: "lowercase",
  },

  // Bottom CTA bar
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    zIndex: 20,
  },
  continueButton: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#5B8C5A",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      default: { elevation: 8 },
    }),
  },
  continueButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueGradient: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  terms: {
    fontSize: 10,
    color: "#cbd5e1",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 14,
  },
});

