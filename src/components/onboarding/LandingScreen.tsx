import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { mediumHaptic } from "../../lib/haptics";
import { MascotBird } from "./MascotBird";
import { WarmBackground } from "./WarmBackground";
import { OB_COLORS, buttonShadow, softShadow } from "./theme";

interface LandingScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const FEATURES: { text: string; icon: string; iconSet: "ion" | "mci"; color: string }[] = [
  { text: "Daily scripture guidance", icon: "book-open-outline", iconSet: "mci", color: "#5B8C5A" },
  { text: "Personalized reflections", icon: "heart-outline", iconSet: "ion", color: "#D4A843" },
  { text: "One simple step each day", icon: "shoe-print", iconSet: "mci", color: "#7C6B4F" },
];

export function LandingScreen({ onGetStarted, onSignIn }: LandingScreenProps) {
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();

  const fadeTitle = useRef(new Animated.Value(isWeb ? 1 : 0)).current;
  const slideTitle = useRef(new Animated.Value(isWeb ? 0 : 30)).current;
  const fadeFeatures = useRef(new Animated.Value(isWeb ? 1 : 0)).current;
  const slideFeatures = useRef(new Animated.Value(isWeb ? 0 : 28)).current;
  const fadeCTA = useRef(new Animated.Value(isWeb ? 1 : 0)).current;
  const slideCTA = useRef(new Animated.Value(isWeb ? 0 : 24)).current;
  const birdSlide = useRef(new Animated.Value(isWeb ? 0 : 80)).current;
  const birdOpacity = useRef(new Animated.Value(isWeb ? 1 : 0)).current;
  const sparkle1 = useRef(new Animated.Value(isWeb ? 1 : 0)).current;
  const sparkle2 = useRef(new Animated.Value(isWeb ? 1 : 0)).current;
  const sparkle3 = useRef(new Animated.Value(isWeb ? 1 : 0)).current;
  const ctaGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isWeb) return;

    Animated.stagger(220, [
      Animated.parallel([
        Animated.timing(fadeTitle, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.spring(slideTitle, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeFeatures, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.spring(slideFeatures, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeCTA, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideCTA, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      ]),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(birdSlide, { toValue: 0, tension: 35, friction: 7, useNativeDriver: true }),
        Animated.timing(birdOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 350);

    const makeSparkle = (anim: Animated.Value, delay: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.2,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

    makeSparkle(sparkle1, 0, 2200);
    makeSparkle(sparkle2, 800, 1900);
    makeSparkle(sparkle3, 1400, 2500);

    Animated.loop(
      Animated.sequence([
        Animated.timing(ctaGlow, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(ctaGlow, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const ctaScale = ctaGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] });

  return (
    <View style={styles.container}>
      <WarmBackground />
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top + 14,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
          },
        ]}
      >
        <StatusBar barStyle="dark-content" />

        <View style={styles.content}>
          <View style={styles.topSection}>
            <Animated.View
              style={[
                styles.heroMascot,
                {
                  opacity: birdOpacity,
                  transform: [{ translateY: birdSlide }],
                  pointerEvents: "none" as any,
                },
              ]}
            >
              <Animated.View style={[styles.sparkle, styles.sparkleOne, { opacity: sparkle1 }]}>
                <Ionicons name="sparkles" size={16} color={OB_COLORS.gold} />
              </Animated.View>
              <Animated.View style={[styles.sparkle, styles.sparkleTwo, { opacity: sparkle2 }]}>
                <MaterialCommunityIcons name="star-four-points" size={14} color={OB_COLORS.gold} />
              </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkleThree, { opacity: sparkle3 }]}>
              <Ionicons name="sparkles" size={12} color={OB_COLORS.primary} />
            </Animated.View>
            <View style={styles.mascotWrap}>
              <MascotBird pose="reading" size="large" animate={false} bobAmount={4} />
            </View>
          </Animated.View>

            <Animated.View style={[styles.titleSection, { opacity: fadeTitle, transform: [{ translateY: slideTitle }] }]}>
              <Text style={styles.title}>
                Walk with God,{"\n"}
                <Text style={styles.titleAccent}>every single day.</Text>
              </Text>

              <Text style={styles.subtitle}>
                2-5 minutes of scripture, reflection, and a next step with calm, clear guidance.
              </Text>
            </Animated.View>
          </View>

          <Animated.View style={[styles.features, { opacity: fadeFeatures, transform: [{ translateY: slideFeatures }] }]}>
            {FEATURES.map((feat, i) => (
              <View key={i} style={styles.featureItem}>
                <View style={[styles.featureIconWrap, { backgroundColor: `${feat.color}12` }]}>
                  {feat.iconSet === "ion" ? (
                    <Ionicons name={feat.icon as any} size={20} color={feat.color} />
                  ) : (
                    <MaterialCommunityIcons name={feat.icon as any} size={20} color={feat.color} />
                  )}
                </View>
                <Text style={styles.featureText}>{feat.text}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View style={[styles.ctaSection, { opacity: fadeCTA, transform: [{ translateY: slideCTA }] }]}>
            <Animated.View style={{ width: "100%", transform: [{ scale: ctaScale }] }}>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                onPress={() => {
                  mediumHaptic();
                  onGetStarted();
                }}
              >
                <LinearGradient
                  colors={["#5B8C5A", "#4A7A49"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonGradient}
                >
                  <Text style={styles.primaryButtonText}>Get started</Text>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={18} color={OB_COLORS.primary} />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Pressable
              style={({ pressed }) => [styles.signInButton, pressed && styles.signInButtonPressed]}
              onPress={() => {
                mediumHaptic();
                onSignIn();
              }}
            >
              <Text style={styles.signInText}>I already have an account</Text>
              <Ionicons name="chevron-forward" size={16} color={OB_COLORS.textMuted} />
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OB_COLORS.cream, overflow: "hidden" },
  safeArea: { flex: 1, zIndex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 4,
    justifyContent: "space-between",
    gap: 24,
  },

  topSection: {
    alignItems: "center",
    gap: 8,
  },
  heroMascot: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 0,
    position: "relative",
  },
  mascotWrap: { zIndex: 3 },
  sparkle: { position: "absolute", zIndex: 1 },
  sparkleOne: { top: -12, right: "16%" },
  sparkleTwo: { top: 50, left: "14%" },
  sparkleThree: { top: -20, left: "58%" },

  titleSection: { alignItems: "center" },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: OB_COLORS.textDark,
    textAlign: "center",
    lineHeight: 44,
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  titleAccent: {
    color: OB_COLORS.primary,
  },
  subtitle: {
    fontSize: 16,
    color: OB_COLORS.textMuted,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 310,
  },

  features: { gap: 14, paddingHorizontal: 8 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 14 },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    ...softShadow,
  },
  featureText: { fontSize: 16, color: OB_COLORS.textBody, fontWeight: "600" },

  ctaSection: { gap: 12, alignItems: "center" },
  primaryButton: {
    borderRadius: 18,
    overflow: "hidden",
    ...buttonShadow,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 18,
  },
  primaryButtonPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  signInButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  signInButtonPressed: { opacity: 0.5 },
  signInText: { fontSize: 15, fontWeight: "600", color: OB_COLORS.textMuted },
});
