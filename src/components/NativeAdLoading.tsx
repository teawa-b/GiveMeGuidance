import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Platform, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAds } from "../lib/AdsContext";
import { usePremium } from "../lib/PremiumContext";

// Conditionally import to avoid crashes in Expo Go
let BannerAd: any = null;
let BannerAdSize: any = null;

try {
  const adsModule = require("react-native-google-mobile-ads");
  BannerAd = adsModule.BannerAd;
  BannerAdSize = adsModule.BannerAdSize;
} catch (e) {
  console.log("[NativeAdLoading] react-native-google-mobile-ads not available");
}

interface NativeAdLoadingProps {
  isVisible: boolean;
  loadingMessage?: string;
}

export function NativeAdLoading({ isVisible, loadingMessage = "Finding guidance..." }: NativeAdLoadingProps) {
  const { shouldShowAds, nativeAdUnitId, isAdsInitialized } = useAds();
  const { isPremium } = usePremium();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Subtle pulse animation for the loading indicator
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Premium users or web - show loading without ad
  if (isPremium || Platform.OS === "web") {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.loadingSection}>
          <Animated.View style={{ opacity: pulseAnim }}>
            <Ionicons name="book-outline" size={32} color="#10b981" />
          </Animated.View>
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      </Animated.View>
    );
  }

  // Check if we can show ads
  const canShowAds = shouldShowAds && isAdsInitialized && BannerAd && !adError;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Loading indicator */}
      <View style={styles.loadingSection}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <Ionicons name="book-outline" size={32} color="#10b981" />
        </Animated.View>
        <Text style={styles.loadingText}>{loadingMessage}</Text>
      </View>

      {/* Ad during loading - using Medium Rectangle format */}
      {canShowAds && (
        <View style={styles.adContainer}>
          <Text style={styles.adLabel}>Sponsored</Text>
          <BannerAd
            unitId={nativeAdUnitId}
            size={BannerAdSize.MEDIUM_RECTANGLE}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
            onAdLoaded={() => {
              console.log("[AdMob] Loading screen ad loaded");
              setAdLoaded(true);
            }}
            onAdFailedToLoad={(error: any) => {
              console.log("[AdMob] Loading screen ad failed:", error);
              setAdError(true);
            }}
          />
        </View>
      )}

      {/* Show placeholder in Expo Go */}
      {shouldShowAds && !BannerAd && (
        <View style={styles.adContainer}>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Ads require development build</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  loadingSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  adContainer: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  adLabel: {
    fontSize: 10,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  placeholder: {
    width: 300,
    height: 250,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 11,
    color: "#d1d5db",
  },
});
