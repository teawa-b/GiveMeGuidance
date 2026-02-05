import React, { useState, useEffect } from "react";
import { View, StyleSheet, Platform, Text, Dimensions } from "react-native";
import Constants from "expo-constants";
import { useAds } from "../lib/AdsContext";
import { usePremium } from "../lib/PremiumContext";

// Check if running in Expo Go (where native modules aren't available)
const isExpoGo = Constants.appOwnership === "expo";

// Get screen width for adaptive banner
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface BannerAdComponentProps {
  style?: object;
}

export function BannerAdComponent({ style }: BannerAdComponentProps) {
  const { shouldShowAds, bannerAdUnitId, isAdsInitialized, BannerAd, BannerAdSize } = useAds();
  const { isPremium } = usePremium();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Log initialization state
  useEffect(() => {
    console.log("[BannerAd] Component mounted", {
      isPremium,
      shouldShowAds,
      isAdsInitialized,
      hasBannerAd: !!BannerAd,
      bannerAdUnitId,
      platform: Platform.OS,
    });
  }, [isPremium, shouldShowAds, isAdsInitialized, BannerAd, bannerAdUnitId]);

  // Don't render anything if premium, on web, or in Expo Go
  if (isPremium || Platform.OS === "web" || isExpoGo) {
    return null;
  }

  // Don't show if ads shouldn't be displayed
  if (!shouldShowAds) {
    console.log("[BannerAd] shouldShowAds is false");
    return null;
  }

  // Native ads module not available - show placeholder
  if (!BannerAd || !isAdsInitialized) {
    console.log("[BannerAd] Waiting for initialization...", { BannerAd: !!BannerAd, isAdsInitialized });
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {!isAdsInitialized ? "Initializing ads..." : "Loading ad..."}
          </Text>
        </View>
      </View>
    );
  }

  // Hide on error after max retries
  if (adError && retryCount >= 3) {
    console.log("[BannerAd] Max retries reached, hiding ad");
    return null;
  }

  return (
    <View style={[styles.container, style, !adLoaded && styles.loading]}>
      <BannerAd
        unitId={bannerAdUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
          networkExtras: {
            collapsible: "bottom",
          },
        }}
        onAdLoaded={() => {
          console.log("[BannerAd] Ad loaded successfully");
          setAdLoaded(true);
          setAdError(null);
        }}
        onAdFailedToLoad={(error: any) => {
          console.log("[BannerAd] Ad failed to load:", {
            code: error?.code,
            message: error?.message,
            domain: error?.domain,
            retryCount,
          });
          setAdError(error?.message || "Unknown error");
          setRetryCount(prev => prev + 1);
        }}
        onAdOpened={() => {
          console.log("[BannerAd] Ad opened");
        }}
        onAdClosed={() => {
          console.log("[BannerAd] Ad closed");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    width: "100%",
  },
  loading: {
    opacity: 0.5,
  },
  placeholder: {
    width: "100%",
    maxWidth: 320,
    height: 50,
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
