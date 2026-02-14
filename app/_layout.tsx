// Must be first import - polyfills for React Native
import "../src/lib/polyfills";

import React, { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet, InteractionManager, Image, AppState } from "react-native";
import { AuthProvider, useAuth } from "../src/lib/AuthContext";
import { PremiumProvider } from "../src/lib/PremiumContext";
import { AdsProvider } from "../src/lib/AdsContext";
import { DataCacheProvider } from "../src/lib/DataCache";
import { OnboardingProvider } from "../src/lib/OnboardingContext";
import { rescheduleAllNotifications, incrementAppOpenCount } from "../src/services/notifications";
// Note: react-native-get-random-values is already imported in polyfills.ts

// Bird icon for loading screen
const appLogo = require("../assets/mascot/bird-reading.png");

function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Debug logging
  console.log("[Auth] RENDER - isLoading:", isLoading, "isAuthenticated:", isAuthenticated, "segments:", segments);

  // Reschedule notifications on every app open / foreground
  useEffect(() => {
    incrementAppOpenCount().catch(() => {});

    // Reschedule on mount and on every foreground resume
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        rescheduleAllNotifications().catch(() => {});
      }
    });
    // Also trigger once now (covers initial app open)
    rescheduleAllNotifications().catch(() => {});

    return () => sub.remove();
  }, []);

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
    
    // Check if we're in the onboarding flow
    const inOnboarding = inAuthGroup && segments[1] === "onboarding";

    // Allow authenticated users to be in tabs, guidance, or chat screen
    const inProtectedRoute = inTabsGroup || inGuidance || inChat;

    console.log("[Auth] Checking redirect - firstSegment:", firstSegment, "isAuthenticated:", isAuthenticated, "inAuthGroup:", inAuthGroup, "inProtectedRoute:", inProtectedRoute, "inOnboarding:", inOnboarding);

    if (isAuthenticated) {
      // User is authenticated - make sure they're in a protected route
      // But allow them to stay in onboarding if they're in the middle of it
      if (!inProtectedRoute && !inOnboarding) {
        console.log("[Auth] User authenticated, redirecting to /(tabs)");
        router.replace("/(tabs)");
      }
    } else {
      // User is not authenticated - allow guest users to remain in app routes
      if (!inAuthGroup && !inProtectedRoute) {
        console.log("[Auth] User not authenticated, redirecting to /(auth)");
        router.replace("/(auth)");
      }
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Image source={appLogo} style={styles.loadingLogo} resizeMode="contain" />
        <ActivityIndicator size="large" color="#10b981" style={styles.loadingSpinner} />
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
            headerTransparent: true,
            headerShadowVisible: false,
            headerBackTitle: "Back",
            headerBackButtonDisplayMode: "default",
            headerTintColor: "#10b981",
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
    backgroundColor: "#f0fdf4",
  },
  loadingLogo: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: 24,
  },
  loadingSpinner: {
    marginTop: 8,
  },
});

// Wrapper component that defers heavy SDK initialization
function DeferredProviders({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for the JS thread to be idle before mounting heavy providers
    // This prevents native module crashes during early startup
    const handle = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });

    return () => handle.cancel();
  }, []);

  if (!isReady) {
    // Render children without the heavy providers during initial mount
    return <>{children}</>;
  }

  return (
    <DataCacheProvider>
      <PremiumProvider>
        <AdsProvider>
          <OnboardingProvider>
            {children}
          </OnboardingProvider>
        </AdsProvider>
      </PremiumProvider>
    </DataCacheProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <DeferredProviders>
        <RootLayoutNav />
      </DeferredProviders>
    </AuthProvider>
  );
}



