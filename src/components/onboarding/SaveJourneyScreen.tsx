import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { EtherealBackground } from "../EtherealBackground";
import { mediumHaptic } from "../../lib/haptics";
import { useAuth } from "../../lib/AuthContext";

interface SaveJourneyScreenProps {
  onAuthenticated: () => void;
  onSkip: () => void;
  onEmailPress: () => void;
}

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
          {/* Header Icon */}
          <View style={styles.iconSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="bookmark" size={40} color="#66b083" />
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Want to save your streak and guidance history?</Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={24} color="#66b083" />
              <Text style={styles.benefitText}>Save your Daily Walks</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={24} color="#66b083" />
              <Text style={styles.benefitText}>Track streaks and progress</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={24} color="#66b083" />
              <Text style={styles.benefitText}>Access on any device</Text>
            </View>
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

          {/* Skip */}
          <Pressable
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              mediumHaptic();
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 40 : 40,
    paddingBottom: 32,
  },
  iconSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#66b083",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 36,
  },
  benefitsList: {
    gap: 16,
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: "#4b5563",
    fontWeight: "500",
  },
  authButtons: {
    gap: 12,
    flex: 1,
    justifyContent: "center",
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
  skipButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
  },
});
