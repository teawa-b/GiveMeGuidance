import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic } from "../../lib/haptics";

// Sage green color palette
const COLORS = {
  primary: "#7FA988",
  primaryDark: "#6B9273",
  backgroundLight: "#F0F7F2",
  surfaceLight: "#FFFFFF",
  textDark: "#1e293b",
  textMuted: "#64748b",
  borderLight: "#e2e8f0",
};

interface LandingScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingScreen({ onGetStarted, onSignIn }: LandingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <EtherealBackground />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Image
              source={require("../../../assets/NewLogo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />

            <Text style={styles.title}>
              Get closer to God,{"\n"}one day at a time
            </Text>
            <Text style={styles.subtitle}>
              2–5 minutes daily. A verse, reflection, and next step.
            </Text>
          </View>

          {/* Features Section */}
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="book-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>Daily scripture guidance</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="heart-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>Personalized reflections</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="footsteps-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>One simple step each day</Text>
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
              onPress={() => {
                mediumHaptic();
                onGetStarted();
              }}
            >
              <Text style={styles.primaryButtonText}>Get started</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.signInButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => {
                mediumHaptic();
                onSignIn();
              }}
            >
              <Text style={styles.signInText}>Sign in</Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 32 : 32,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  logoSection: {
    alignItems: "center",
    paddingTop: 24,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: COLORS.textDark,
    textAlign: "center",
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 26,
    maxWidth: 280,
  },
  features: {
    gap: 24,
    paddingLeft: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  featureText: {
    fontSize: 17,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  ctaSection: {
    gap: 16,
    alignItems: "center",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 999,
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  primaryButtonPressed: {
    backgroundColor: COLORS.primaryDark,
    transform: [{ translateY: 1 }],
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  signInButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  signInText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textMuted,
    textDecorationLine: "underline",
    textDecorationColor: "#cbd5e1",
  },
});
