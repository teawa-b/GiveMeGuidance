import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { mediumHaptic } from "../../lib/haptics";
import { useAuth } from "../../lib/AuthContext";
import { WarmBackground } from "./WarmBackground";
import { OB_COLORS, buttonShadow, softShadow } from "./theme";

interface LoginScreenProps {
  onBack?: () => void;
  onAuthenticated: () => void;
  onEmailPress: () => void;
}

export function LoginScreen({ onBack, onAuthenticated, onEmailPress }: LoginScreenProps) {
  const { signInWithApple, signInWithGoogle } = useAuth();
  const insets = useSafeAreaInsets();
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
      <WarmBackground />
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top + 8,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          },
        ]}
      >
        <StatusBar barStyle="dark-content" />

        {onBack && (
          <Pressable style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color={OB_COLORS.textMuted} />
          </Pressable>
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoHalo}>
              <Image
                source={require("../../../assets/mascot/bird-reading.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your daily walk with guidance.</Text>
          </View>

          <View style={styles.authButtons}>
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
                  <Ionicons name="logo-apple" size={22} color="#ffffff" style={styles.buttonIcon} />
                  <Text style={styles.appleButtonText}>Continue with Apple</Text>
                </>
              )}
            </Pressable>

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
                <ActivityIndicator color={OB_COLORS.textDark} size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#4285F4" style={styles.buttonIcon} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </Pressable>

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
              <Ionicons name="mail-outline" size={20} color={OB_COLORS.primaryDark} style={styles.buttonIcon} />
              <Text style={styles.emailButtonText}>Continue with Email</Text>
            </Pressable>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          <View style={styles.trustSection}>
            <Ionicons name="shield-checkmark-outline" size={16} color={OB_COLORS.textLight} />
            <Text style={styles.trustText}>Your guidance entries stay private to your account.</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OB_COLORS.cream,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: OB_COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    ...softShadow,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 4,
  },
  header: {
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 18,
  },
  logoHalo: {
    width: 104,
    height: 104,
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 104,
    height: 104,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: OB_COLORS.textDark,
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: OB_COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 310,
  },
  authButtons: {
    gap: 12,
    paddingHorizontal: 4,
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 58,
    borderRadius: 18,
    paddingHorizontal: 20,
    gap: 10,
  },
  buttonIcon: {},
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  appleButton: {
    backgroundColor: OB_COLORS.black,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.24,
        shadowRadius: 10,
      },
      default: {
        elevation: 5,
      },
    }),
  },
  appleButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  googleButton: {
    backgroundColor: OB_COLORS.surface,
    borderWidth: 1.5,
    borderColor: "rgba(91,140,90,0.18)",
    ...softShadow,
  },
  googleButtonText: {
    color: OB_COLORS.textDark,
    fontSize: 16,
    fontWeight: "600",
  },
  emailButton: {
    backgroundColor: OB_COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: "rgba(91,140,90,0.34)",
    ...buttonShadow,
  },
  emailButtonText: {
    color: OB_COLORS.primaryDark,
    fontSize: 16,
    fontWeight: "700",
  },
  errorContainer: {
    backgroundColor: OB_COLORS.errorBg,
    borderWidth: 1,
    borderColor: "rgba(229,62,62,0.25)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  errorText: {
    color: OB_COLORS.error,
    fontSize: 14,
    textAlign: "center",
  },
  trustSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  trustText: {
    fontSize: 13,
    color: OB_COLORS.textLight,
    textAlign: "center",
    lineHeight: 18,
  },
});

