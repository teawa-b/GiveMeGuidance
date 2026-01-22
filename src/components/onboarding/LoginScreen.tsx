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
import { mediumHaptic } from "../../lib/haptics";
import { useAuth } from "../../lib/AuthContext";

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
        const result = await signInWithApple(credential.identityToken);
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
        <View style={styles.content}>
          {/* Back button */}
          {onBack && (
            <Pressable style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#6b7280" />
            </Pressable>
          )}

          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/NewLogo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
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
                  <Ionicons name="logo-apple" size={24} color="#ffffff" style={styles.buttonIcon} />
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
                  <View style={styles.googleIconContainer}>
                    <Text style={styles.googleIcon}>G</Text>
                  </View>
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
              <Ionicons name="mail-outline" size={22} color="#374151" style={styles.buttonIcon} />
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
            <Ionicons name="shield-checkmark-outline" size={16} color="#9ca3af" />
            <Text style={styles.trustText}>
              Your guidance is private. We don't share your personal entries.
            </Text>
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 12 : 12,
    paddingBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  authButtons: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 20,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  appleButton: {
    backgroundColor: "#000000",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  appleButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
  },
  googleButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dadce0",
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4285F4",
  },
  googleButtonText: {
    color: "#1f1f1f",
    fontSize: 17,
    fontWeight: "500",
  },
  emailButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emailButtonText: {
    color: "#374151",
    fontSize: 17,
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  errorText: {
    color: "#dc2626",
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
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 18,
  },
});
