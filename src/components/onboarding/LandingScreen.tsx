import React from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic } from "../../lib/haptics";

const { width } = Dimensions.get("window");

interface LandingScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingScreen({ onGetStarted, onSignIn }: LandingScreenProps) {
  return (
    <View style={styles.container}>
      <EtherealBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/NewLogo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.mainSection}>
            <Text style={styles.title}>
              Get closer to God,{"\n"}one day at a time
            </Text>
            <Text style={styles.subtitle}>
              2–5 minutes daily. A verse, reflection, and next step.
            </Text>
          </View>

          {/* Feature highlights */}
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="book-outline" size={20} color="#66b083" />
              </View>
              <Text style={styles.featureText}>Daily scripture guidance</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="heart-outline" size={20} color="#66b083" />
              </View>
              <Text style={styles.featureText}>Personalized reflections</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="footsteps-outline" size={20} color="#66b083" />
              </View>
              <Text style={styles.featureText}>One simple step each day</Text>
            </View>
          </View>

          {/* CTAs */}
          <View style={styles.ctaSection}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
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
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                mediumHaptic();
                onSignIn();
              }}
            >
              <Text style={styles.secondaryButtonText}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 20 : 20,
    paddingBottom: 32,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  mainSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 17,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  features: {
    gap: 16,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 15,
    color: "#4b5563",
    fontWeight: "500",
  },
  ctaSection: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#66b083",
    paddingVertical: 18,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#66b083",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#ffffff",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
