// Must be first import - polyfills for React Native
import "../src/lib/polyfills";

import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, View, ActivityIndicator, StyleSheet } from "react-native";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider, useAuthToken } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import * as SecureStore from "expo-secure-store";
import "react-native-get-random-values";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

// Storage for auth tokens
// Web: use localStorage directly
// Native: use SecureStore
const storage = Platform.OS === "web"
  ? {
      getItem: async (key: string) => {
        try {
          const value = localStorage.getItem(key);
          console.log("[Storage] getItem", key, value ? "found" : "null");
          return value;
        } catch (e) {
          console.log("[Storage] getItem error", key, e);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          console.log("[Storage] setItem", key, value?.substring(0, 50) + "...");
          localStorage.setItem(key, value);
        } catch (e) {
          console.log("[Storage] setItem error", key, e);
        }
      },
      removeItem: async (key: string) => {
        try {
          console.log("[Storage] removeItem", key);
          localStorage.removeItem(key);
        } catch (e) {
          console.log("[Storage] removeItem error", key, e);
        }
      },
    }
  : {
      getItem: async (key: string) => {
        const value = await SecureStore.getItemAsync(key);
        console.log("[Storage] getItem", key, value ? "found" : "null");
        return value;
      },
      setItem: async (key: string, value: string) => {
        console.log("[Storage] setItem", key, value?.substring(0, 50) + "...");
        await SecureStore.setItemAsync(key, value);
      },
      removeItem: async (key: string) => {
        console.log("[Storage] removeItem", key);
        await SecureStore.deleteItemAsync(key);
      },
    };

function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const token = useAuthToken(); // Also check token directly since isAuthenticated can be buggy
  const segments = useSegments();
  const router = useRouter();

  // Use token presence as fallback for isAuthenticated
  const hasAuth = isAuthenticated || token !== null;

  // Debug logging - log on every render
  console.log("[Auth] RENDER - isLoading:", isLoading, "isAuthenticated:", isAuthenticated, "token:", token ? "present" : "null", "hasAuth:", hasAuth, "segments:", segments);

  useEffect(() => {
    if (isLoading) {
      console.log("[Auth] Still loading, skipping redirect");
      return;
    }

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === "(auth)";
    const inTabsGroup = firstSegment === "(tabs)";
    const inGuidance = firstSegment === "guidance";
    
    // Allow authenticated users to be in tabs OR guidance screen
    const inProtectedRoute = inTabsGroup || inGuidance;
    
    console.log("[Auth] Checking redirect - firstSegment:", firstSegment, "hasAuth:", hasAuth, "inAuthGroup:", inAuthGroup, "inProtectedRoute:", inProtectedRoute);

    if (hasAuth) {
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
  }, [hasAuth, isLoading, segments, router]);

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
            headerTitle: "Your Guidance",
            headerBackTitle: "Back",
            headerTintColor: "#10b981",
            headerStyle: { backgroundColor: "#fafafa" },
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
    <ConvexAuthProvider client={convex} storage={storage}>
      <RootLayoutNav />
    </ConvexAuthProvider>
  );
}

