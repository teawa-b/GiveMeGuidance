import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { useAuth } from "../../lib/AuthContext";

// Colors - matching SaveJourneyScreen
const COLORS = {
  primary: "#749F82",
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

interface LoginScreenProps {
  onBack?: () => void;
  onAuthenticated: () => void;
  onEmailPress: () => void;
}

export function LoginScreen({ onBack, onAuthenticated, onEmailPress }: LoginScreenProps) {
  const { signInWithApple, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState<"apple" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        {/* Back button */}
        {onBack && (
          <Pressable 
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]} 
            onPress={onBack}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textMuted} />
          </Pressable>
        )}

          {/* Logo & Header */}
          <View style={styles.header}>
            <Image
              source={require("../../../assets/NewLogo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your journey
            </Text>
          </View>

          {/* Auth Buttons */}
          <View style={styles.authButtons}>
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
          </View>

          {/* Error message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Trust line */}
          <View style={styles.trustSection}>
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.trustText}>
              Your guidance is private and secure
            </Text>
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 20 : 20,
    paddingBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 48,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.textDark,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  authButtons: {
    flex: 1,
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 16,
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
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
    borderColor: COLORS.border,
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
    borderColor: COLORS.border,
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
    marginTop: 12,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: "center",
  },
  trustSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  trustText: {
    fontSize: 13,
    color: COLORS.textLight,
    textAlign: "center",
  },
});
