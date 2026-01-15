// Must be first import - polyfills for React Native
import "../src/lib/polyfills";

import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { AuthProvider, useAuth } from "../src/lib/AuthContext";
import { PremiumProvider } from "../src/lib/PremiumContext";
import { AdsProvider } from "../src/lib/AdsContext";
import "react-native-get-random-values";

function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Debug logging
  console.log("[Auth] RENDER - isLoading:", isLoading, "isAuthenticated:", isAuthenticated, "segments:", segments);

  useEffect(() => {
    if (isLoading) {
      console.log("[Auth] Still loading, skipping redirect");
      return;
    }

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === "(auth)";
    const inTabsGroup = firstSegment === "(tabs)";
    const inGuidance = firstSegment === "guidance";
    const inChat = firstSegment === "chat";

    // Allow authenticated users to be in tabs, guidance, or chat screen
    const inProtectedRoute = inTabsGroup || inGuidance || inChat;

    console.log("[Auth] Checking redirect - firstSegment:", firstSegment, "isAuthenticated:", isAuthenticated, "inAuthGroup:", inAuthGroup, "inProtectedRoute:", inProtectedRoute);

    if (isAuthenticated) {
      // User is authenticated - make sure they're in a protected route (tabs or guidance)
      if (!inProtectedRoute && !inAuthGroup) {
        console.log("[Auth] User authenticated, redirecting to /(tabs)");
        router.replace("/(tabs)");
      }
    } else {
      // User is not authenticated - make sure they're in auth
      if (!inAuthGroup) {
        console.log("[Auth] User not authenticated, redirecting to /(auth)");
        router.replace("/(auth)");
      }
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#fafafa" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="guidance"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "Back",
            headerTintColor: "#10b981",
            headerStyle: { backgroundColor: "#fafaf6" },
            headerShadowVisible: false,
            headerTransparent: false,
          }}
        />
        <Stack.Screen
          name="chat"
          options={{
            headerShown: true,
            headerTitle: "Chat",
            headerBackTitle: "Back",
            headerTintColor: "#10b981",
            headerStyle: { backgroundColor: "#fafaf6" },
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <PremiumProvider>
        <AdsProvider>
          <RootLayoutNav />
        </AdsProvider>
      </PremiumProvider>
    </AuthProvider>
  );
}

