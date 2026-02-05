import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as AppleAuthentication from "expo-apple-authentication";
import { mediumHaptic } from "../../lib/haptics";
import { useAuth } from "../../lib/AuthContext";
import { MascotBird } from "./MascotBird";
import { WarmBackground } from "./WarmBackground";
import { OB_COLORS, softShadow } from "./theme";

interface LoginScreenProps {
  onBack?: () => void;
  onAuthenticated: () => void;
  onEmailPress: () => void;
}

export function LoginScreen({ onBack, onAuthenticated, onEmailPress }: LoginScreenProps) {
  const { signInWithApple, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState<"apple" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

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
        if (result.error) setError(result.error);
        else onAuthenticated();
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
      if (result.error) setError(result.error);
      else onAuthenticated();
    } catch {
      setError("Google sign in failed. Please try again.");
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
            paddingTop: insets.top + 10,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
      >
        {onBack && (
          <Pressable style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color={OB_COLORS.textMuted} />
          </Pressable>
        )}

        <View style={styles.header}>
          <MascotBird pose="pointing-up" size="medium" animate delay={100} />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        <View style={styles.authButtons}>
          <Pressable
            style={({ pressed }) => [styles.authButton, styles.appleButton, pressed && styles.buttonPressed, loading !== null && styles.buttonDisabled]}
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

          <Pressable
            style={({ pressed }) => [styles.authButton, styles.googleButton, pressed && styles.buttonPressed, loading !== null && styles.buttonDisabled]}
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
                <Image source={require("../../../assets/google-icon.png")} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.authButton, styles.emailButton, pressed && styles.buttonPressed, loading !== null && styles.buttonDisabled]}
            onPress={() => {
              mediumHaptic();
              onEmailPress();
            }}
            disabled={loading !== null}
          >
            <Ionicons name="mail-outline" size={18} color={OB_COLORS.textMuted} />
            <Text style={styles.emailButtonText}>Continue with Email</Text>
          </Pressable>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.trustSection}>
          <Ionicons name="shield-checkmark-outline" size={16} color={OB_COLORS.textLight} />
          <Text style={styles.trustText}>Your guidance is private and secure</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OB_COLORS.cream },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: OB_COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    ...softShadow,
  },
  header: { alignItems: "center", marginTop: 16, marginBottom: 30 },
  title: { fontSize: 30, fontWeight: "800", color: OB_COLORS.textDark, marginTop: 10, marginBottom: 8, textAlign: "center", letterSpacing: -0.3 },
  subtitle: { fontSize: 16, color: OB_COLORS.textMuted, textAlign: "center" },

  authButtons: { flex: 1, justifyContent: "center", gap: 14, paddingHorizontal: 12 },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 18,
    gap: 12,
  },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  buttonDisabled: { opacity: 0.6 },
  appleButton: {
    backgroundColor: OB_COLORS.black,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  appleButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  googleButton: {
    backgroundColor: OB_COLORS.surface,
    borderWidth: 1.5,
    borderColor: OB_COLORS.border,
    ...softShadow,
  },
  googleIcon: { width: 20, height: 20 },
  googleButtonText: { color: OB_COLORS.textDark, fontSize: 15, fontWeight: "600" },
  emailButton: {
    backgroundColor: OB_COLORS.surface,
    borderWidth: 1.5,
    borderColor: OB_COLORS.border,
    ...softShadow,
  },
  emailButtonText: { color: OB_COLORS.textDark, fontSize: 15, fontWeight: "600" },
  errorContainer: { backgroundColor: OB_COLORS.errorBg, padding: 12, borderRadius: 12, marginHorizontal: 12, marginTop: 16 },
  errorText: { color: OB_COLORS.error, fontSize: 14, textAlign: "center" },
  trustSection: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 12 },
  trustText: { fontSize: 13, color: OB_COLORS.textLight, fontWeight: "500" },
});
