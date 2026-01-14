import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
  Image,
  Pressable,
} from "react-native";
import { useAuth } from "../lib/AuthContext";
import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { AuthButton } from "./AuthButton";
import { EmailAuthForm } from "./EmailAuthForm";
import { EtherealBackground } from "./EtherealBackground";

// Required for web browser redirect
WebBrowser.maybeCompleteAuthSession();

interface AuthScreenProps {
  onAuthenticated?: () => void;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const { signIn, signUp, signInWithGoogle, signInWithApple, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState<"apple" | "google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debug: log auth state changes in AuthScreen
  useEffect(() => {
    console.log("[AuthScreen] Auth state - isLoading:", isLoading, "isAuthenticated:", isAuthenticated);
  }, [isLoading, isAuthenticated]);

  // Handle Apple Sign In (iOS native)
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
          onAuthenticated?.();
        }
      }
    } catch (e: any) {
      if (e.code === "ERR_REQUEST_CANCELED") {
        // User canceled - don't show error
      } else {
        setError("Apple sign in failed. Please try again.");
        console.error("Apple auth error:", e);
      }
    } finally {
      setLoading(null);
    }
  };

  // Handle Google Sign In
  const handleGoogleAuth = async () => {
    try {
      setLoading("google");
      setError(null);

      const result = await signInWithGoogle();
      if (result.error) {
        setError(result.error);
      } else {
        onAuthenticated?.();
      }
    } catch (e) {
      setError("Google sign in failed. Please try again.");
      console.error("Google auth error:", e);
    } finally {
      setLoading(null);
    }
  };

  // Handle Email Sign In
  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      setLoading("email");
      setError(null);

      console.log("[AuthScreen] Calling signIn with password...");
      const result = await signIn(email, password);

      if (result.error) {
        console.error("[AuthScreen] signIn error:", result.error);
        setError(result.error);
        throw new Error(result.error);
      }

      console.log("[AuthScreen] signIn successful, navigating to tabs...");
      router.replace("/(tabs)");
    } catch (e: any) {
      console.error("[AuthScreen] signIn error:", e);
      if (!error) {
        setError(e.message || "Invalid email or password");
      }
      throw e;
    } finally {
      setLoading(null);
    }
  };

  // Handle Email Sign Up
  const handleEmailSignUp = async (email: string, password: string) => {
    try {
      setLoading("email");
      setError(null);

      console.log("[AuthScreen] Calling signUp...");
      const result = await signUp(email, password);

      if (result.error) {
        console.error("[AuthScreen] signUp error:", result.error);
        setError(result.error);
        throw new Error(result.error);
      }

      // Check if email confirmation is required
      if (result.needsConfirmation) {
        console.log("[AuthScreen] Email confirmation required");
        setShowConfirmation(true);
        setShowEmailForm(false);
        return;
      }

      console.log("[AuthScreen] signUp successful, navigating to tabs...");
      router.replace("/(tabs)");
    } catch (e: any) {
      console.error("[AuthScreen] signUp error:", e);
      if (!error) {
        setError(e.message || "Could not create account");
      }
      throw e;
    } finally {
      setLoading(null);
    }
  };

  // Show confirmation message
  if (showConfirmation) {
    return (
      <View style={styles.container}>
        <EtherealBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.confirmationContainer}>
              <Ionicons name="mail-outline" size={64} color="#10b981" />
              <Text style={styles.confirmationTitle}>Check your email</Text>
              <Text style={styles.confirmationText}>
                We've sent you a confirmation link. Please check your email and click the link to verify your account.
              </Text>
              <Pressable
                style={styles.backButton}
                onPress={() => {
                  setShowConfirmation(false);
                  setShowEmailForm(true);
                }}
              >
                <Text style={styles.backButtonText}>Back to Sign In</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Show email form
  if (showEmailForm) {
    return (
      <View style={styles.container}>
        <EtherealBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <EmailAuthForm
              onSignIn={handleEmailSignIn}
              onSignUp={handleEmailSignUp}
              onBack={() => {
                setShowEmailForm(false);
                setError(null);
              }}
              loading={loading === "email"}
              error={error}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EtherealBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/NewLogo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Give Me Guidance</Text>
            <Text style={styles.subtitle}>
              Discover personalized wisdom from Scripture for life's moments
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            {[
              { icon: "heart-outline", text: "Personalized biblical guidance" },
              { icon: "bookmark-outline", text: "Save verses for later" },
              { icon: "shield-checkmark-outline", text: "Private & secure" },
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons
                  name={feature.icon as any}
                  size={20}
                  color="#10b981"
                />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Auth Buttons */}
          <View style={styles.authButtons}>
            {/* Apple - Show on all platforms */}
            <AuthButton
              type="apple"
              onPress={handleAppleAuth}
              loading={loading === "apple"}
              disabled={loading !== null}
            />

            {/* Google */}
            <AuthButton
              type="google"
              onPress={handleGoogleAuth}
              loading={loading === "google"}
              disabled={loading !== null}
            />

            {/* Email */}
            <AuthButton
              type="email"
              onPress={() => setShowEmailForm(true)}
              disabled={loading !== null}
            />
          </View>

          {/* Error message */}
          {error && !showEmailForm && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Terms */}
          <Text style={styles.terms}>
            By continuing, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  features: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  featureText: {
    fontSize: 15,
    color: "#4b5563",
    marginLeft: 12,
  },
  authButtons: {
    flex: 1,
    justifyContent: "center",
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
  terms: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: "#6b7280",
    textDecorationLine: "underline",
  },
  confirmationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
  },
  confirmationText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: "#10b981",
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
