import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { useAuth } from "../../lib/AuthContext";

// Colors
const COLORS = {
  primary: "#749F82",
  primaryDark: "#5C8268",
  primaryLight: "rgba(116, 159, 130, 0.12)",
  surface: "#FFFFFF",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
  border: "#E5E7EB",
  black: "#000000",
  error: "#DC2626",
  errorBg: "#FEF2F2",
};

interface SaveJourneyScreenProps {
  onAuthenticated: () => void;
  onSkip: () => void;
  onEmailPress: () => void;
}

const benefits = [
  "Save your Daily Walks",
  "Track streaks and progress",
  "Access on any device",
];

export function SaveJourneyScreen({
  onAuthenticated,
  onSkip,
  onEmailPress,
}: SaveJourneyScreenProps) {
  const { signInWithApple, signInWithGoogle, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState<"apple" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, call onAuthenticated immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      onAuthenticated();
    }
  }, [isAuthenticated]);

  const handleAppleAuth = async () => {
    if (Platform.OS !== "ios") {
      Alert.alert("Not Available", "Apple Sign In is only available on iOS devices");
      return;
    }

    try {
      setLoading("apple");
      setError(null);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        // Pass fullName to signInWithApple - Apple only provides this on FIRST sign-in
        const result = await signInWithApple(credential.identityToken, credential.fullName);
        if (result.error) {
          setError(result.error);
        } else {
          onAuthenticated();
        }
      }
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        setError("Apple sign in failed. Please try again.");
        console.error("Apple auth error:", e);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading("google");
      setError(null);

      const result = await signInWithGoogle();
      if (result.error) {
        setError(result.error);
      } else {
        onAuthenticated();
      }
    } catch (e) {
      setError("Google sign in failed. Please try again.");
      console.error("Google auth error:", e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <EtherealBackground />
      <SafeAreaView style={styles.safeArea}>
        {/* Top Section */}
        <View style={styles.topSection}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="bookmark" size={28} color={COLORS.primary} />
            </View>

            {/* Title */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>
                Preserve your{"\n"}
                <Text style={styles.titleAccent}>journey.</Text>
              </Text>
              <Text style={styles.subtitle}>JOIN GIVEMEGUIDANCE</Text>
            </View>

            {/* Benefits List */}
            <View style={styles.benefitsList}>
              {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={12} color={COLORS.primary} />
                  </View>
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Section - Auth Buttons */}
          <View style={styles.bottomSection}>
            {/* Apple */}
            <Pressable
              style={({ pressed }) => [
                styles.authButton,
                styles.appleButton,
                pressed && styles.buttonPressed,
                loading !== null && styles.buttonDisabled,
              ]}
              onPress={() => {
                mediumHaptic();
                handleAppleAuth();
              }}
              disabled={loading !== null}
            >
              {loading === "apple" ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="#ffffff" />
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </>
              )}
            </Pressable>

            {/* Google */}
            <Pressable
              style={({ pressed }) => [
                styles.authButton,
                styles.googleButton,
                pressed && styles.buttonPressed,
                loading !== null && styles.buttonDisabled,
              ]}
              onPress={() => {
                mediumHaptic();
                handleGoogleAuth();
              }}
              disabled={loading !== null}
            >
              {loading === "google" ? (
                <ActivityIndicator color="#333" size="small" />
              ) : (
                <>
                  <Image 
                    source={require("../../../assets/google-icon.png")} 
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </Pressable>

            {/* Email */}
            <Pressable
              style={({ pressed }) => [
                styles.authButton,
                styles.emailButton,
                pressed && styles.buttonPressed,
                loading !== null && styles.buttonDisabled,
              ]}
              onPress={() => {
                mediumHaptic();
                onEmailPress();
              }}
              disabled={loading !== null}
            >
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.emailButtonText}>Continue with Email</Text>
            </Pressable>

            {/* Error message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Skip */}
            <Pressable
              style={({ pressed }) => [
                styles.skipButton,
                pressed && { opacity: 0.6 },
              ]}
              onPress={() => {
                lightHaptic();
                onSkip();
              }}
            >
              <Text style={styles.skipButtonText}>Not now</Text>
            </Pressable>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 32 : 32,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
    paddingTop: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.textDark,
    textAlign: "center",
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: COLORS.primary,
    fontStyle: "italic",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textLight,
    letterSpacing: 1.5,
    marginTop: 12,
  },
  benefitsList: {
    alignSelf: "center",
    alignItems: "flex-start",
    gap: 20,
    marginTop: 40,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(116, 159, 130, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  benefitText: {
    fontSize: 18,
    fontWeight: "500",
    color: COLORS.textDark,
    opacity: 0.9,
  },
  bottomSection: {
    gap: 12,
    paddingHorizontal: 24,
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: 16,
    gap: 12,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  appleButton: {
    backgroundColor: COLORS.black,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  appleButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  googleButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: "500",
  },
  emailButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emailButtonText: {
    color: COLORS.textDark,
    fontSize: 15,
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: COLORS.errorBg,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: "center",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textLight,
  },
});
