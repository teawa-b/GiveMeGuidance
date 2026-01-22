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
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { mediumHaptic } from "../../lib/haptics";

const { width, height } = Dimensions.get("window");

// Sage green color palette
const COLORS = {
  primary: "#7FA988",
  primaryDark: "#6B9273",
  backgroundLight: "#F0F7F2",
  surfaceLight: "#FFFFFF",
  textDark: "#1e293b",
  textMuted: "#64748b",
  leafLight1: "#D8EAD9",
  leafLight2: "#E1F0E3",
  leafLight3: "#DCEFE0",
  leafLight4: "#E6F4E8",
  borderLight: "#e2e8f0",
};

interface LandingScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

// Floating leaf component
function FloatingLeaf({ 
  style, 
  path, 
  color, 
  size,
  delay = 0,
}: { 
  style?: any; 
  path: string; 
  color: string; 
  size: number;
  delay?: number;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = 6000 + Math.random() * 4000;
    
    const animateFloat = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -15,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 10,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(rotate, {
              toValue: 1,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: 0,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(rotate, {
              toValue: 0,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    const timeout = setTimeout(animateFloat, delay);
    return () => clearTimeout(timeout);
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <Path d={path} />
      </Svg>
    </Animated.View>
  );
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
      <LinearGradient
        colors={["#E8F5E9", "#F0F7F2", "#FFFFFF"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Floating Leaves Background */}
      <View style={styles.leavesContainer} pointerEvents="none">
        <FloatingLeaf
          style={styles.leaf1}
          path="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,21.74C8.72,15.5 18.55,18.12 21.87,13.13C24.28,9.53 20.31,7.24 17,8M9.94,15.68C11.53,13.3 15.69,12.75 16.5,12.5C16.42,12.75 16.33,13 16.23,13.26C15.25,13.79 11.2,15.11 9.94,15.68Z"
          color={COLORS.leafLight1}
          size={140}
          delay={0}
        />
        <FloatingLeaf
          style={styles.leaf2}
          path="M2,22L22,2C22,2 18,12 12,16C8,19 2,22 2,22Z"
          color={COLORS.leafLight2}
          size={120}
          delay={2000}
        />
        <FloatingLeaf
          style={styles.leaf3}
          path="M12,2C8,2 3,8 3,14C3,20 12,22 12,22C12,22 21,20 21,14C21,8 16,2 12,2Z"
          color={COLORS.leafLight3}
          size={100}
          delay={1000}
        />
        <FloatingLeaf
          style={styles.leaf4}
          path="M12,2C8,2 4,6 4,12C4,18 12,22 12,22C12,22 20,18 20,12C20,6 16,2 12,2M12,20C12,20 6,17 6,12C6,8 9,4 12,4C15,4 18,8 18,12C18,17 12,20 12,20Z"
          color={COLORS.leafLight4}
          size={180}
          delay={500}
        />
      </View>

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
            <View style={styles.logoOuter}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../../assets/NewLogo.png")}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
            </View>

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
  leavesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  leaf1: {
    position: "absolute",
    top: -30,
    left: -30,
    opacity: 0.6,
  },
  leaf2: {
    position: "absolute",
    top: height * 0.2,
    right: -40,
    opacity: 0.5,
    transform: [{ rotate: "45deg" }],
  },
  leaf3: {
    position: "absolute",
    bottom: height * 0.25,
    left: -20,
    opacity: 0.4,
    transform: [{ rotate: "-12deg" }],
  },
  leaf4: {
    position: "absolute",
    bottom: -50,
    right: -50,
    opacity: 0.7,
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
  logoOuter: {
    padding: 4,
    borderRadius: 64,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    marginBottom: 32,
  },
  logoContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceLight,
    ...Platform.select({
      ios: {
        shadowColor: "#7FA988",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logoImage: {
    width: "100%",
    height: "100%",
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
