import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
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
  const { signIn } = useAuthActions();
  const token = useAuthToken();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [loading, setLoading] = useState<"apple" | "google" | "email" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debug: log auth state changes in AuthScreen
  useEffect(() => {
    console.log("[AuthScreen] Auth state - token:", token ? "present" : "null", "isLoading:", isLoading, "isAuthenticated:", isAuthenticated);
  }, [token, isLoading, isAuthenticated]);

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

      // Sign in with Convex using the Apple credential
      await signIn("apple", {
        idToken: credential.identityToken,
        nonce: credential.authorizationCode,
      });

      onAuthenticated?.();
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

      // Use Convex's built-in OAuth flow
      const redirectTo = Linking.createURL("/");
      await signIn("google", { redirectTo });

      onAuthenticated?.();
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
      const result = await signIn("password", {
        email,
        password,
        flow: "signIn",
      });
      console.log("[AuthScreen] signIn result:", JSON.stringify(result, null, 2));
      console.log("[AuthScreen] signingIn:", result?.signingIn);

      // Workaround: isAuthenticated state not updating properly after signIn
      // Force navigation when signIn succeeds
      if (result?.signingIn) {
        console.log("[AuthScreen] signIn successful, navigating to tabs...");
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      console.error("[AuthScreen] signIn error:", e);
      setError(e.message || "Invalid email or password");
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

      console.log("[AuthScreen] Calling signIn with password (signUp flow)...");
      const result = await signIn("password", {
        email,
        password,
        flow: "signUp",
      });
      console.log("[AuthScreen] signUp result:", JSON.stringify(result, null, 2));
      console.log("[AuthScreen] signingIn:", result?.signingIn);

      // Workaround: isAuthenticated state not updating properly after signIn
      // Force navigation when signUp succeeds
      if (result?.signingIn) {
        console.log("[AuthScreen] signUp successful, navigating to tabs...");
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      console.error("[AuthScreen] signUp error:", e);
      setError(e.message || "Could not create account");
      throw e;
    } finally {
      setLoading(null);
    }
  };

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
});
