import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import * as SecureStore from "expo-secure-store";
import { SearchBar } from "../../src/components/SearchBar";
import { EtherealBackground } from "../../src/components/EtherealBackground";

const trustIndicators = [
  { icon: "checkmark-circle" as const, text: "Biblical wisdom" },
  { icon: "checkmark-circle" as const, text: "Personalized guidance" },
  { icon: "checkmark-circle" as const, text: "Private & secure" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const [signingOut, setSigningOut] = useState(false);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push({
        pathname: "/guidance",
        params: { q: query.trim() },
      });
    }
  };

  const doSignOut = async () => {
    try {
      setSigningOut(true);
      console.log("[SignOut] Starting sign out...");
      
      // Call Convex signOut
      await signOut();
      console.log("[SignOut] Convex signOut complete");
      
      // Manually clear tokens from storage
      const storageKey = "httpsfastjaguar962convexcloud";
      if (Platform.OS === "web") {
        localStorage.removeItem(`__convexAuthJWT_${storageKey}`);
        localStorage.removeItem(`__convexAuthRefreshToken_${storageKey}`);
        localStorage.removeItem(`__convexAuthOAuthVerifier_${storageKey}`);
        console.log("[SignOut] Cleared web localStorage");
        
        // Force page reload to clear React state
        window.location.href = "/";
        return;
      } else {
        await SecureStore.deleteItemAsync(`__convexAuthJWT_${storageKey}`);
        await SecureStore.deleteItemAsync(`__convexAuthRefreshToken_${storageKey}`);
        console.log("[SignOut] Cleared SecureStore");
        router.replace("/(auth)");
      }
    } catch (e) {
      console.error("[SignOut] Error:", e);
      // Force reload on web even on error
      if (Platform.OS === "web") {
        window.location.href = "/";
      } else {
        router.replace("/(auth)");
      }
    } finally {
      setSigningOut(false);
    }
  };

  const handleSignOut = async () => {
    // On web, use confirm dialog; on native use Alert
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        await doSignOut();
      }
    } else {
      Alert.alert(
        "Sign Out",
        "Are you sure you want to sign out?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign Out",
            style: "destructive",
            onPress: doSignOut,
          },
        ]
      );
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Ethereal background with leaves, sparkles, and flowing waves */}
      <EtherealBackground />

      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/NewLogo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>
              <Text style={styles.logoTextBold}>Guidance</Text>
              <Text style={styles.logoTextLight}> from Scripture</Text>
            </Text>
          </View>
          <Pressable 
            style={styles.menuButton} 
            onPress={handleSignOut}
            disabled={signingOut}
          >
            <Ionicons 
              name="log-out-outline" 
              size={24} 
              color={signingOut ? "#9ca3af" : "#4b5563"} 
            />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Heading */}
              <View style={styles.headingContainer}>
                <Text style={styles.heading}>
                  What do you need{"\n"}
                  <Text style={styles.headingGradient}>guidance</Text>
                  {" "}on today?
                </Text>
                <Text style={styles.subheading}>
                  Share what's on your heart, and receive personalized wisdom from Scripture.
                </Text>
              </View>

              {/* Search bar */}
              <SearchBar onSubmit={handleSearch} />

              {/* Trust indicators - vertical list */}
              <View style={styles.trustContainer}>
                {trustIndicators.map((item, index) => (
                  <View key={index} style={styles.trustItem}>
                    <Ionicons name={item.icon} size={22} color="#10b981" />
                    <Text style={styles.trustText}>{item.text}</Text>
                  </View>
                ))}
              </View>

              {/* Footer link */}
              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>givemeguidance.com</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  logoText: {
    fontSize: 18,
  },
  logoTextBold: {
    fontWeight: "700",
    color: "#111827",
  },
  logoTextLight: {
    fontWeight: "400",
    color: "#6b7280",
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    alignItems: "center",
    gap: 28,
  },
  headingContainer: {
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  heading: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
    lineHeight: 38,
  },
  headingGradient: {
    color: "#10b981",
  },
  subheading: {
    fontSize: 16,
    textAlign: "center",
    color: "#6b7280",
    lineHeight: 24,
    maxWidth: 300,
  },
  trustContainer: {
    alignItems: "flex-start",
    gap: 14,
    marginTop: 8,
    alignSelf: "center",
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  trustText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#374151",
  },
  footerContainer: {
    marginTop: "auto",
    paddingTop: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#9ca3af",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: "hidden",
  },
});
