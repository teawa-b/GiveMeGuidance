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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { mediumHaptic, lightHaptic } from "../../lib/haptics";
import { useAuth } from "../../lib/AuthContext";
import { MascotBird } from "./MascotBird";
import { WarmBackground } from "./WarmBackground";
import { OB_COLORS, cardShadow, buttonShadow, softShadow } from "./theme";
import { LinearGradient } from "expo-linear-gradient";

interface SaveJourneyScreenProps {
  onAuthenticated: () => void;
  onSkip: () => void;
  onEmailPress: () => void;
}

const benefits: { text: string; icon: string; iconSet: "ion" | "mci"; color: string }[] = [
  { text: "Save your Daily Walks", icon: "book-open-outline", iconSet: "mci", color: "#5B8C5A" },
  { text: "Track streaks and progress", icon: "flame-outline", iconSet: "ion", color: "#E8963E" },
  { text: "Access on any device", icon: "phone-portrait-outline", iconSet: "ion", color: "#6B7DB3" },
];

export function SaveJourneyScreen({ onAuthenticated, onSkip, onEmailPress }: SaveJourneyScreenProps) {
  const { signInWithApple, signInWithGoogle, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState<"apple" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) onAuthenticated();
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
      <SafeAreaView style={styles.safeArea}>
        {/* Top Section */}
        <View style={styles.topSection}>
          {/* Bird with sparkles */}
          <MascotBird pose="reading" size="large" animate delay={100} />

          <View style={styles.titleSection}>
            <Text style={styles.title}>
              Preserve your{"\n"}
              <Text style={styles.titleAccent}>journey.</Text>
            </Text>
            <Text style={styles.subtitleBadge}>JOIN GIVEMEGUIDANCE</Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsList}>
            {benefits.map((b, i) => (
              <View key={i} style={styles.benefitItem}>
                <View style={[styles.benefitIconWrap, { backgroundColor: b.color + "15" }]}>
                  {b.iconSet === "ion" ? (
                    <Ionicons name={b.icon as any} size={18} color={b.color} />
                  ) : (
                    <MaterialCommunityIcons name={b.icon as any} size={18} color={b.color} />
                  )}
                </View>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Auth Buttons */}
        <View style={styles.bottomSection}>
          {/* Apple */}
          <Pressable
            style={({ pressed }) => [styles.authButton, styles.appleButton, pressed && styles.buttonPressed, loading !== null && styles.buttonDisabled]}
            onPress={() => { mediumHaptic(); handleAppleAuth(); }}
            disabled={loading !== null}
          >
            {loading === "apple" ? <ActivityIndicator color="#ffffff" size="small" /> : (
              <>
                <Ionicons name="logo-apple" size={20} color="#ffffff" />
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </>
            )}
          </Pressable>

          {/* Google */}
          <Pressable
            style={({ pressed }) => [styles.authButton, styles.googleButton, pressed && styles.buttonPressed, loading !== null && styles.buttonDisabled]}
            onPress={() => { mediumHaptic(); handleGoogleAuth(); }}
            disabled={loading !== null}
          >
            {loading === "google" ? <ActivityIndicator color="#333" size="small" /> : (
              <>
                <Image source={require("../../../assets/google-icon.png")} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {/* Email */}
          <Pressable
            style={({ pressed }) => [styles.authButton, styles.emailButton, pressed && styles.buttonPressed, loading !== null && styles.buttonDisabled]}
            onPress={() => { mediumHaptic(); onEmailPress(); }}
            disabled={loading !== null}
          >
            <Ionicons name="mail-outline" size={18} color={OB_COLORS.textMuted} />
            <Text style={styles.emailButtonText}>Continue with Email</Text>
          </Pressable>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable style={({ pressed }) => [styles.skipButton, pressed && { opacity: 0.6 }]} onPress={() => { lightHaptic(); onSkip(); }}>
            <Text style={styles.skipButtonText}>Not now</Text>
          </Pressable>
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
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 24 : 24,
    paddingBottom: 24,
    justifyContent: "space-between",
  },
  topSection: { alignItems: "center", paddingTop: 12 },
  titleSection: { alignItems: "center", marginTop: 12, marginBottom: 24 },
  title: { fontSize: 34, fontWeight: "800", color: OB_COLORS.textDark, textAlign: "center", lineHeight: 42, letterSpacing: -0.5 },
  titleAccent: { color: OB_COLORS.primary, fontStyle: "italic" },
  subtitleBadge: { fontSize: 11, fontWeight: "700", color: OB_COLORS.textLight, letterSpacing: 2, marginTop: 10 },

  benefitsList: { alignSelf: "center", alignItems: "flex-start", gap: 16 },
  benefitItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  benefitIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  benefitText: { fontSize: 16, fontWeight: "600", color: OB_COLORS.textDark },

  bottomSection: { gap: 12, paddingHorizontal: 16 },
  authButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    height: 54, borderRadius: 999, gap: 12,
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
    backgroundColor: OB_COLORS.surface, borderWidth: 1.5, borderColor: OB_COLORS.border,
    ...softShadow,
  },
  googleIcon: { width: 20, height: 20 },
  googleButtonText: { color: OB_COLORS.textDark, fontSize: 15, fontWeight: "600" },
  emailButton: {
    backgroundColor: OB_COLORS.surface, borderWidth: 1.5, borderColor: OB_COLORS.border,
    ...softShadow,
  },
  emailButtonText: { color: OB_COLORS.textDark, fontSize: 15, fontWeight: "600" },
  errorContainer: { backgroundColor: OB_COLORS.errorBg, padding: 12, borderRadius: 12 },
  errorText: { color: OB_COLORS.error, fontSize: 14, textAlign: "center" },
  skipButton: { alignItems: "center", paddingVertical: 10 },
  skipButtonText: { fontSize: 14, fontWeight: "600", color: OB_COLORS.textLight },
});
